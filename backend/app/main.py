import os, time, asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, String, Integer, Float, ForeignKey, DateTime, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session
from passlib.context import CryptContext

DATABASE_URL=os.getenv("DATABASE_URL","sqlite:///./procurex.db")
SECRET_KEY=os.getenv("JWT_SECRET","change-this-demo-secret-before-deployment")
ALGORITHM="HS256"
engine=create_engine(DATABASE_URL, connect_args={"check_same_thread":False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal=sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
pwd=CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
class Base(DeclarativeBase): pass
class User(Base):
    __tablename__="users"
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    phone:Mapped[str]=mapped_column(String,unique=True,index=True)
    name:Mapped[str]=mapped_column(String)
    role:Mapped[str]=mapped_column(String)
    password_hash:Mapped[str]=mapped_column(String)
class Listing(Base):
    __tablename__="listings"
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    farmer_id:Mapped[int]=mapped_column(ForeignKey("users.id"))
    crop:Mapped[str]=mapped_column(String)
    quantity_kg:Mapped[float]=mapped_column(Float)
    status:Mapped[str]=mapped_column(String,default="REGISTERED")
class Booking(Base):
    __tablename__="bookings"
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    farmer_id:Mapped[int]=mapped_column(ForeignKey("users.id"))
    listing_id:Mapped[int]=mapped_column(ForeignKey("listings.id"))
    slot_id:Mapped[int]=mapped_column(Integer)
    token_number:Mapped[int]=mapped_column(Integer)
    status:Mapped[str]=mapped_column(String,default="WAITING")
class QualityRecord(Base):
    __tablename__="quality_records"
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    listing_id:Mapped[int]=mapped_column(Integer,unique=True)
    grade:Mapped[str]=mapped_column(String)
    moisture_percent:Mapped[float]=mapped_column(Float)
    foreign_matter_percent:Mapped[float]=mapped_column(Float)
    accepted_quantity_kg:Mapped[float]=mapped_column(Float)
    checked_by:Mapped[int]=mapped_column(Integer)
class Procurement(Base):
    __tablename__="procurements"
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    listing_id:Mapped[int]=mapped_column(Integer,unique=True)
    status:Mapped[str]=mapped_column(String,default="APPROVED")
    approved_by:Mapped[int]=mapped_column(Integer)
Base.metadata.create_all(engine)
def db():
    s=SessionLocal()
    try: yield s
    finally: s.close()
def seed():
    with SessionLocal() as s:
        if s.scalar(select(User).limit(1)): return
        for phone,name,role in [("9000000001","Demo Farmer","farmer"),("9000000002","Demo Field Agent","field_agent"),("9000000003","Demo Procurement Officer","procurement_officer"),("9000000006","Demo Admin","admin")]:
            s.add(User(phone=phone,name=name,role=role,password_hash=pwd.hash("123456")))
        s.commit()
seed()
app=FastAPI(title="Procure-X API",version="1.0.0",description="Demo backend for Smart Farmer Procurement Management System")
app.add_middleware(CORSMiddleware,allow_origins=os.getenv("CORS_ORIGINS","http://localhost:5173,http://127.0.0.1:5173").split(","),allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
security=HTTPBearer(auto_error=False)
def token_for(u):
    return jwt.encode({"sub":str(u.id),"role":u.role,"exp":datetime.now(timezone.utc)+timedelta(hours=12)},SECRET_KEY,algorithm=ALGORITHM)
def current_user(creds:HTTPAuthorizationCredentials=Depends(security),s:Session=Depends(db)):
    if not creds: raise HTTPException(401,"Authentication required")
    try: uid=int(jwt.decode(creds.credentials,SECRET_KEY,algorithms=[ALGORITHM])["sub"])
    except (JWTError,ValueError,KeyError): raise HTTPException(401,"Invalid or expired token")
    u=s.get(User,uid)
    if not u: raise HTTPException(401,"User not found")
    return u
def roles(*allowed):
    def dep(u:User=Depends(current_user)):
        if u.role not in allowed: raise HTTPException(403,"Insufficient permissions")
        return u
    return dep
class Login(BaseModel): phone:str; password:str
class Register(BaseModel): phone:str; name:str; password:str=Field(min_length=6)
class ListingIn(BaseModel): crop:str; quantity_kg:float=Field(gt=0)
class BookingIn(BaseModel): listing_id:int; slot_id:int
class QualityIn(BaseModel):
    grade:str; moisture_percent:float=Field(ge=0,le=100); foreign_matter_percent:float=Field(ge=0,le=100); accepted_quantity_kg:float=Field(ge=0)
clients:dict[int,set[WebSocket]]={}
def user_out(u): return {"id":u.id,"phone":u.phone,"name":u.name,"role":u.role}
def listing_out(x): return {"id":x.id,"farmer_id":x.farmer_id,"crop":x.crop,"quantity_kg":x.quantity_kg,"status":x.status}
def booking_out(b): return {"id":b.id,"farmer_id":b.farmer_id,"listing_id":b.listing_id,"slot_id":b.slot_id,"token_number":b.token_number,"status":b.status}
def queue_data(s,b):
    bookings=list(s.scalars(select(Booking).where(Booking.slot_id==b.slot_id).order_by(Booking.token_number)))
    current=max([x.token_number for x in bookings if x.status=="SERVED"],default=0)
    ahead=max(0,b.token_number-current-1) if b.status!="SERVED" else 0
    return {**booking_out(b),"current_token":current,"people_ahead":ahead,"estimated_wait_minutes":ahead*5,"queue_length":sum(x.status=="WAITING" for x in bookings)}
async def broadcast(slot_id,s):
    for b in s.scalars(select(Booking).where(Booking.slot_id==slot_id)):
        data=queue_data(s,b)
        for ws in list(clients.get(b.id,set())):
            try: await ws.send_json(data)
            except: clients[b.id].discard(ws)
@app.get("/health")
def health(): return {"status":"ok","service":"procure-x-api"}
@app.post("/auth/login")
def login(p:Login,s:Session=Depends(db)):
    u=s.scalar(select(User).where(User.phone==p.phone))
    if not u or not pwd.verify(p.password,u.password_hash): raise HTTPException(401,"Invalid phone number or password")
    return {"access_token":token_for(u),"token_type":"bearer"}
@app.post("/auth/register",status_code=201)
def register(p:Register,s:Session=Depends(db)):
    if s.scalar(select(User).where(User.phone==p.phone)): raise HTTPException(409,"Phone number already registered")
    u=User(phone=p.phone,name=p.name,role="farmer",password_hash=pwd.hash(p.password));s.add(u);s.commit();s.refresh(u);return user_out(u)
@app.get("/auth/me")
def me(u:User=Depends(current_user)): return user_out(u)
@app.post("/farmers/me/listings",status_code=201)
def create_listing(p:ListingIn,u:User=Depends(roles("farmer")),s:Session=Depends(db)):
    x=Listing(farmer_id=u.id,crop=p.crop,quantity_kg=p.quantity_kg);s.add(x);s.commit();s.refresh(x);return listing_out(x)
@app.post("/slots/book",status_code=201)
async def book(p:BookingIn,u:User=Depends(roles("farmer")),s:Session=Depends(db)):
    x=s.get(Listing,p.listing_id)
    if not x or x.farmer_id!=u.id: raise HTTPException(404,"Crop listing not found")
    if p.slot_id not in (1,2,3): raise HTTPException(400,"Unknown slot")
    count=len(list(s.scalars(select(Booking).where(Booking.slot_id==p.slot_id,Booking.status=="WAITING"))))
    if count>=5: raise HTTPException(409,"This slot is full. Choose another slot.")
    existing=s.scalar(select(Booking).where(Booking.listing_id==x.id))
    if existing and existing.status=="WAITING": raise HTTPException(409,"This listing already has an active booking")
    token=max([b.token_number for b in s.scalars(select(Booking).where(Booking.slot_id==p.slot_id))],default=0)+1
    b=Booking(farmer_id=u.id,listing_id=x.id,slot_id=p.slot_id,token_number=token);s.add(b);s.commit();s.refresh(b)
    return booking_out(b)
@app.get("/queue/status/{booking_id}")
def queue_status(booking_id:int,u:User=Depends(current_user),s:Session=Depends(db)):
    b=s.get(Booking,booking_id)
    if not b or (u.role=="farmer" and b.farmer_id!=u.id): raise HTTPException(404,"Booking not found")
    return queue_data(s,b)
@app.websocket("/ws/queue/{booking_id}")
async def queue_ws(ws:WebSocket,booking_id:int,token:str):
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM]); uid=int(payload["sub"])
    except Exception:
        await ws.close(code=1008);return
    with SessionLocal() as s:
        b=s.get(Booking,booking_id)
        if not b or (payload.get("role")=="farmer" and b.farmer_id!=uid):
            await ws.close(code=1008);return
        slot_id=b.slot_id
    await ws.accept();clients.setdefault(booking_id,set()).add(ws)
    try:
        with SessionLocal() as s: await ws.send_json(queue_data(s,s.get(Booking,booking_id)))
        while True: await ws.receive_text()
    except WebSocketDisconnect: pass
    finally: clients.get(booking_id,set()).discard(ws)
@app.post("/queue/advance/{slot_id}")
async def advance(slot_id:int,u:User=Depends(roles("field_agent","admin","procurement_officer")),s:Session=Depends(db)):
    b=s.scalar(select(Booking).where(Booking.slot_id==slot_id,Booking.status=="WAITING").order_by(Booking.token_number))
    if not b: raise HTTPException(404,"No waiting token in this slot")
    b.status="SERVED";s.commit()
    await broadcast(slot_id,s)
    return {"slot_id":slot_id,"current_token":b.token_number,"status":"SERVED"}
@app.post("/quality/{listing_id}/grade")
def grade(listing_id:int,p:QualityIn,u:User=Depends(roles("field_agent","admin")),s:Session=Depends(db)):
    x=s.get(Listing,listing_id)
    if not x: raise HTTPException(404,"Listing not found")
    q=s.scalar(select(QualityRecord).where(QualityRecord.listing_id==listing_id))
    if not q: q=QualityRecord(listing_id=listing_id,checked_by=u.id,**p.model_dump());s.add(q)
    else:
        for k,v in p.model_dump().items(): setattr(q,k,v)
        q.checked_by=u.id
    x.status="QUALITY_CHECKED";s.commit();return {"listing_id":listing_id,"grade":q.grade,"moisture_percent":q.moisture_percent,"foreign_matter_percent":q.foreign_matter_percent,"accepted_quantity_kg":q.accepted_quantity_kg,"checked_by":q.checked_by,"status":"QUALITY_CHECKED"}
@app.get("/quality/{listing_id}")
def get_quality(listing_id:int,u:User=Depends(current_user),s:Session=Depends(db)):
    x=s.get(Listing,listing_id)
    if not x or (u.role=="farmer" and x.farmer_id!=u.id): raise HTTPException(404,"Listing not found")
    q=s.scalar(select(QualityRecord).where(QualityRecord.listing_id==listing_id))
    if not q: raise HTTPException(404,"Quality result not found")
    return {"listing_id":listing_id,"grade":q.grade,"moisture_percent":q.moisture_percent,"foreign_matter_percent":q.foreign_matter_percent,"accepted_quantity_kg":q.accepted_quantity_kg,"checked_by":q.checked_by,"status":"QUALITY_CHECKED"}
@app.post("/procurement/{listing_id}/approve")
def approve(listing_id:int,u:User=Depends(roles("procurement_officer","admin")),s:Session=Depends(db)):
    x=s.get(Listing,listing_id)
    if not x: raise HTTPException(404,"Listing not found")
    q=s.scalar(select(QualityRecord).where(QualityRecord.listing_id==listing_id))
    if not q: raise HTTPException(409,"Quality grading must be completed before approval")
    p=s.scalar(select(Procurement).where(Procurement.listing_id==listing_id))
    if not p: p=Procurement(listing_id=listing_id,approved_by=u.id);s.add(p)
    else: p.status="APPROVED";p.approved_by=u.id
    x.status="APPROVED";s.commit();return {"listing_id":listing_id,"status":"APPROVED","approved_by":u.id}
@app.get("/procurement/{listing_id}")
def procurement(listing_id:int,u:User=Depends(current_user),s:Session=Depends(db)):
    x=s.get(Listing,listing_id)
    if not x or (u.role=="farmer" and x.farmer_id!=u.id): raise HTTPException(404,"Procurement not found")
    p=s.scalar(select(Procurement).where(Procurement.listing_id==listing_id))
    if not p: raise HTTPException(404,"Procurement not found")
    return {"listing_id":listing_id,"status":p.status,"approved_by":p.approved_by}
