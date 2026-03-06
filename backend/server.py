from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime
import hashlib
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'cic_dental_clinic')]

# Create the main app
app = FastAPI(title="CIC Dental Clinic API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# User Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    created_at: datetime
    is_admin: bool = False

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

# Service Models
class ServiceCreate(BaseModel):
    name: str
    description: str
    price: Optional[str] = None
    duration: Optional[str] = None
    image: Optional[str] = None

class ServiceResponse(BaseModel):
    id: str
    name: str
    description: str
    price: Optional[str] = None
    duration: Optional[str] = None
    image: Optional[str] = None
    created_at: datetime

# Doctor Models
class DoctorCreate(BaseModel):
    name: str
    specialization: str
    experience: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    service_ids: List[str] = []  # Servicii atribuite

class DoctorResponse(BaseModel):
    id: str
    name: str
    specialization: str
    experience: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    service_ids: List[str] = []
    created_at: datetime

# Consultation Request Models
class ConsultationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    description: str
    problem_type: Optional[str] = None
    affected_area: Optional[str] = None
    symptom_duration: Optional[str] = None
    pain_level: Optional[int] = None
    allergies: Optional[str] = None
    previous_treatments: Optional[str] = None
    images: List[str] = []

class ConsultationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    email: str
    phone: str
    description: str
    problem_type: Optional[str] = None
    affected_area: Optional[str] = None
    symptom_duration: Optional[str] = None
    pain_level: Optional[int] = None
    allergies: Optional[str] = None
    previous_treatments: Optional[str] = None
    images: List[str] = []
    status: str = "pending"
    created_at: datetime
    response: Optional[str] = None
    response_at: Optional[datetime] = None
    # Extended response fields
    diagnosis: Optional[str] = None
    recommended_treatment: Optional[str] = None
    estimated_cost: Optional[str] = None
    next_steps: Optional[str] = None
    attached_files: List[dict] = []  # [{name, url/base64, type}]

class ConsultationReply(BaseModel):
    response: str
    diagnosis: Optional[str] = None
    recommended_treatment: Optional[str] = None
    estimated_cost: Optional[str] = None
    next_steps: Optional[str] = None
    attached_files: List[dict] = []  # [{name, data, type}]

# Notification Models
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    consultation_id: str
    title: str
    message: str
    is_read: bool = False
    created_at: datetime
    attached_files: List[dict] = []

# Chat Models
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Token necesar")
    
    token = credentials.credentials
    user = await db.users.find_one({"token": token})
    if not user:
        raise HTTPException(status_code=401, detail="Token invalid")
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        token = credentials.credentials
        user = await db.users.find_one({"token": token})
        return user
    except:
        return None

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acces interzis - necesită drepturi de administrator")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email-ul este deja înregistrat")
    
    token = generate_token()
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "password": hash_password(user_data.password),
        "token": token,
        "is_admin": False,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    return {
        "token": token,
        "user": UserResponse(
            id=user_doc["id"],
            name=user_doc["name"],
            email=user_doc["email"],
            phone=user_doc["phone"],
            created_at=user_doc["created_at"],
            is_admin=user_doc["is_admin"]
        ).dict()
    }

@api_router.post("/auth/login", response_model=dict)
async def login(login_data: UserLogin):
    user = await db.users.find_one({
        "email": login_data.email,
        "password": hash_password(login_data.password)
    })
    
    if not user:
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    
    new_token = generate_token()
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"token": new_token}}
    )
    
    return {
        "token": new_token,
        "user": UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            phone=user["phone"],
            created_at=user["created_at"],
            is_admin=user.get("is_admin", False)
        ).dict()
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        phone=user["phone"],
        created_at=user["created_at"],
        is_admin=user.get("is_admin", False)
    )

@api_router.put("/auth/me", response_model=UserResponse)
async def update_me(update_data: UserUpdate, user = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if update_dict:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": update_dict}
        )
        user.update(update_dict)
    
    return UserResponse(
        id=user["id"],
        name=user.get("name", update_dict.get("name", "")),
        email=user["email"],
        phone=user.get("phone", update_dict.get("phone", "")),
        created_at=user["created_at"],
        is_admin=user.get("is_admin", False)
    )

@api_router.post("/auth/logout")
async def logout(user = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"token": None}}
    )
    return {"message": "Deconectat cu succes"}

# ==================== ADMIN AUTH ====================

@api_router.post("/admin/login", response_model=dict)
async def admin_login(login_data: UserLogin):
    user = await db.users.find_one({
        "email": login_data.email,
        "password": hash_password(login_data.password),
        "is_admin": True
    })
    
    if not user:
        raise HTTPException(status_code=401, detail="Credențiale admin invalide")
    
    new_token = generate_token()
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"token": new_token}}
    )
    
    return {
        "token": new_token,
        "user": UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            phone=user["phone"],
            created_at=user["created_at"],
            is_admin=True
        ).dict()
    }

# ==================== SERVICES ROUTES ====================

@api_router.get("/services", response_model=List[ServiceResponse])
async def get_services():
    services = await db.services.find().to_list(100)
    return [ServiceResponse(
        id=s["id"],
        name=s["name"],
        description=s["description"],
        price=s.get("price"),
        duration=s.get("duration"),
        image=s.get("image"),
        created_at=s["created_at"]
    ) for s in services]

@api_router.post("/services", response_model=ServiceResponse)
async def create_service(service_data: ServiceCreate, admin = Depends(get_admin_user)):
    service_doc = {
        "id": str(uuid.uuid4()),
        **service_data.dict(),
        "created_at": datetime.utcnow()
    }
    await db.services.insert_one(service_doc)
    return ServiceResponse(**service_doc)

@api_router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, service_data: ServiceCreate, admin = Depends(get_admin_user)):
    result = await db.services.find_one_and_update(
        {"id": service_id},
        {"$set": service_data.dict()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Serviciul nu a fost găsit")
    return ServiceResponse(
        id=result["id"],
        name=result["name"],
        description=result["description"],
        price=result.get("price"),
        duration=result.get("duration"),
        image=result.get("image"),
        created_at=result["created_at"]
    )

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, admin = Depends(get_admin_user)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Serviciul nu a fost găsit")
    return {"message": "Serviciul a fost șters"}

# ==================== DOCTORS ROUTES ====================

@api_router.get("/doctors", response_model=List[DoctorResponse])
async def get_doctors():
    doctors = await db.doctors.find().to_list(100)
    return [DoctorResponse(
        id=d["id"],
        name=d["name"],
        specialization=d["specialization"],
        experience=d.get("experience"),
        image=d.get("image"),
        description=d.get("description"),
        service_ids=d.get("service_ids", []),
        created_at=d["created_at"]
    ) for d in doctors]

@api_router.post("/doctors", response_model=DoctorResponse)
async def create_doctor(doctor_data: DoctorCreate, admin = Depends(get_admin_user)):
    doctor_doc = {
        "id": str(uuid.uuid4()),
        **doctor_data.dict(),
        "created_at": datetime.utcnow()
    }
    await db.doctors.insert_one(doctor_doc)
    return DoctorResponse(**doctor_doc)

@api_router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(doctor_id: str, doctor_data: DoctorCreate, admin = Depends(get_admin_user)):
    result = await db.doctors.find_one_and_update(
        {"id": doctor_id},
        {"$set": doctor_data.dict()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Medicul nu a fost găsit")
    return DoctorResponse(
        id=result["id"],
        name=result["name"],
        specialization=result["specialization"],
        experience=result.get("experience"),
        image=result.get("image"),
        description=result.get("description"),
        service_ids=result.get("service_ids", []),
        created_at=result["created_at"]
    )

@api_router.delete("/doctors/{doctor_id}")
async def delete_doctor(doctor_id: str, admin = Depends(get_admin_user)):
    result = await db.doctors.delete_one({"id": doctor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medicul nu a fost găsit")
    return {"message": "Medicul a fost șters"}

# ==================== CONSULTATIONS ROUTES ====================

@api_router.post("/consultations", response_model=ConsultationResponse)
async def create_consultation(consultation_data: ConsultationCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = None
    if credentials:
        try:
            user = await get_current_user(credentials)
            user_id = user["id"]
        except:
            pass
    
    consultation_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        **consultation_data.dict(),
        "status": "pending",
        "response": None,
        "response_at": None,
        "diagnosis": None,
        "recommended_treatment": None,
        "estimated_cost": None,
        "next_steps": None,
        "attached_files": [],
        "created_at": datetime.utcnow()
    }
    await db.consultations.insert_one(consultation_doc)
    return ConsultationResponse(**consultation_doc)

@api_router.get("/consultations", response_model=List[ConsultationResponse])
async def get_consultations(admin = Depends(get_admin_user)):
    consultations = await db.consultations.find().sort("created_at", -1).to_list(100)
    return [ConsultationResponse(
        id=c["id"],
        user_id=c.get("user_id"),
        name=c["name"],
        email=c["email"],
        phone=c["phone"],
        description=c["description"],
        problem_type=c.get("problem_type"),
        affected_area=c.get("affected_area"),
        symptom_duration=c.get("symptom_duration"),
        pain_level=c.get("pain_level"),
        allergies=c.get("allergies"),
        previous_treatments=c.get("previous_treatments"),
        images=c.get("images", []),
        status=c.get("status", "pending"),
        created_at=c["created_at"],
        response=c.get("response"),
        response_at=c.get("response_at"),
        diagnosis=c.get("diagnosis"),
        recommended_treatment=c.get("recommended_treatment"),
        estimated_cost=c.get("estimated_cost"),
        next_steps=c.get("next_steps"),
        attached_files=c.get("attached_files", [])
    ) for c in consultations]

@api_router.get("/consultations/{consultation_id}", response_model=ConsultationResponse)
async def get_consultation(consultation_id: str, admin = Depends(get_admin_user)):
    consultation = await db.consultations.find_one({"id": consultation_id})
    if not consultation:
        raise HTTPException(status_code=404, detail="Cererea nu a fost găsită")
    return ConsultationResponse(
        id=consultation["id"],
        user_id=consultation.get("user_id"),
        name=consultation["name"],
        email=consultation["email"],
        phone=consultation["phone"],
        description=consultation["description"],
        problem_type=consultation.get("problem_type"),
        affected_area=consultation.get("affected_area"),
        symptom_duration=consultation.get("symptom_duration"),
        pain_level=consultation.get("pain_level"),
        allergies=consultation.get("allergies"),
        previous_treatments=consultation.get("previous_treatments"),
        images=consultation.get("images", []),
        status=consultation.get("status", "pending"),
        created_at=consultation["created_at"],
        response=consultation.get("response"),
        response_at=consultation.get("response_at"),
        diagnosis=consultation.get("diagnosis"),
        recommended_treatment=consultation.get("recommended_treatment"),
        estimated_cost=consultation.get("estimated_cost"),
        next_steps=consultation.get("next_steps"),
        attached_files=consultation.get("attached_files", [])
    )

@api_router.post("/consultations/{consultation_id}/reply", response_model=ConsultationResponse)
async def reply_consultation(consultation_id: str, reply_data: ConsultationReply, admin = Depends(get_admin_user)):
    consultation = await db.consultations.find_one({"id": consultation_id})
    if not consultation:
        raise HTTPException(status_code=404, detail="Cererea nu a fost găsită")
    
    now = datetime.utcnow()
    update_data = {
        "response": reply_data.response,
        "response_at": now,
        "status": "responded",
        "diagnosis": reply_data.diagnosis,
        "recommended_treatment": reply_data.recommended_treatment,
        "estimated_cost": reply_data.estimated_cost,
        "next_steps": reply_data.next_steps,
        "attached_files": reply_data.attached_files
    }
    
    await db.consultations.update_one(
        {"id": consultation_id},
        {"$set": update_data}
    )
    
    # Create notification for user if logged in
    if consultation.get("user_id"):
        notification_doc = {
            "id": str(uuid.uuid4()),
            "user_id": consultation["user_id"],
            "consultation_id": consultation_id,
            "title": "Răspuns la consultația ta",
            "message": reply_data.response,
            "is_read": False,
            "created_at": now,
            "attached_files": reply_data.attached_files
        }
        await db.notifications.insert_one(notification_doc)
    
    consultation.update(update_data)
    
    return ConsultationResponse(
        id=consultation["id"],
        user_id=consultation.get("user_id"),
        name=consultation["name"],
        email=consultation["email"],
        phone=consultation["phone"],
        description=consultation["description"],
        problem_type=consultation.get("problem_type"),
        affected_area=consultation.get("affected_area"),
        symptom_duration=consultation.get("symptom_duration"),
        pain_level=consultation.get("pain_level"),
        allergies=consultation.get("allergies"),
        previous_treatments=consultation.get("previous_treatments"),
        images=consultation.get("images", []),
        status="responded",
        created_at=consultation["created_at"],
        response=reply_data.response,
        response_at=now,
        diagnosis=reply_data.diagnosis,
        recommended_treatment=reply_data.recommended_treatment,
        estimated_cost=reply_data.estimated_cost,
        next_steps=reply_data.next_steps,
        attached_files=reply_data.attached_files
    )

@api_router.delete("/consultations/{consultation_id}")
async def delete_consultation(consultation_id: str, admin = Depends(get_admin_user)):
    result = await db.consultations.delete_one({"id": consultation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cererea nu a fost găsită")
    return {"message": "Cererea a fost ștearsă"}

# ==================== NOTIFICATIONS ROUTES ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [NotificationResponse(
        id=n["id"],
        user_id=n["user_id"],
        consultation_id=n["consultation_id"],
        title=n["title"],
        message=n["message"],
        is_read=n.get("is_read", False),
        created_at=n["created_at"],
        attached_files=n.get("attached_files", [])
    ) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notificarea nu a fost găsită")
    return {"message": "Notificare marcată ca citită"}

@api_router.get("/notifications/unread-count")
async def get_unread_count(user = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": user["id"], "is_read": False})
    return {"count": count}

# ==================== USER CONSULTATIONS HISTORY ====================

@api_router.get("/my-consultations", response_model=List[ConsultationResponse])
async def get_my_consultations(user = Depends(get_current_user)):
    consultations = await db.consultations.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [ConsultationResponse(
        id=c["id"],
        user_id=c.get("user_id"),
        name=c["name"],
        email=c["email"],
        phone=c["phone"],
        description=c["description"],
        problem_type=c.get("problem_type"),
        affected_area=c.get("affected_area"),
        symptom_duration=c.get("symptom_duration"),
        pain_level=c.get("pain_level"),
        allergies=c.get("allergies"),
        previous_treatments=c.get("previous_treatments"),
        images=c.get("images", []),
        status=c.get("status", "pending"),
        created_at=c["created_at"],
        response=c.get("response"),
        response_at=c.get("response_at"),
        diagnosis=c.get("diagnosis"),
        recommended_treatment=c.get("recommended_treatment"),
        estimated_cost=c.get("estimated_cost"),
        next_steps=c.get("next_steps"),
        attached_files=c.get("attached_files", [])
    ) for c in consultations]

# ==================== AI ASSISTANT ROUTES ====================

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(chat_data: ChatMessage, user = Depends(get_optional_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    session_id = chat_data.session_id or str(uuid.uuid4())
    
    # Get or create chat history for this session
    chat_history = await db.chat_sessions.find_one({"session_id": session_id})
    if not chat_history:
        chat_history = {
            "session_id": session_id,
            "user_id": user["id"] if user else None,
            "messages": [],
            "created_at": datetime.utcnow()
        }
        await db.chat_sessions.insert_one(chat_history)
    
    # Build conversation history
    history_text = ""
    for msg in chat_history.get("messages", [])[-10:]:  # Last 10 messages for context
        role = "Pacient" if msg["role"] == "user" else "Asistent"
        history_text += f"{role}: {msg['content']}\n"
    
    system_message = """Ești Asistentul CIC, un consultant dental virtual profesionist al Clinicii Dentare CIC din Chișinău, Moldova.

ROLUL TĂU:
- Ajuți pacienții cu informații despre sănătatea dentară
- Răspunzi la întrebări despre probleme dentare comune
- Oferi sfaturi generale de igienă orală
- Explici proceduri dentare într-un mod accesibil
- Recomanzi când pacientul ar trebui să consulte un medic stomatolog

IMPORTANTE:
- Folosește ÎNTOTDEAUNA limba română
- Fii empatic și profesionist
- NU pune diagnostic definitiv - recomandă întotdeauna consultație la clinică pentru probleme serioase
- Menționează că Clinica CIC oferă consultații și tratamente de calitate
- Prețurile sunt în MDL (lei moldovenești)
- Clinica este situată în Chișinău, Moldova

SERVICII DISPONIBILE LA CLINICA CIC:
- Consultație Dentară: 150 MDL
- Detartraj și Igienizare: 250 MDL  
- Albire Dentară: 800 MDL
- Implant Dentar: de la 2500 MDL
- Coroană Dentară: de la 800 MDL
- Tratament de Canal: de la 500 MDL

Răspunde concis dar complet. Dacă pacientul descrie simptome îngrijorătoare, recomandă-i să programeze o consultație.
"""
    
    if history_text:
        system_message += f"\n\nIstoric conversație:\n{history_text}"
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4.1-mini")
        
        user_message = UserMessage(text=chat_data.message)
        response = await chat.send_message(user_message)
        
        # Save messages to history
        await db.chat_sessions.update_one(
            {"session_id": session_id},
            {"$push": {
                "messages": {
                    "$each": [
                        {"role": "user", "content": chat_data.message, "timestamp": datetime.utcnow()},
                        {"role": "assistant", "content": response, "timestamp": datetime.utcnow()}
                    ]
                }
            }}
        )
        
        return ChatResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Eroare AI: {str(e)}")

@api_router.delete("/chat/{session_id}")
async def clear_chat_history(session_id: str):
    await db.chat_sessions.delete_one({"session_id": session_id})
    return {"message": "Istoricul conversației a fost șters"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Check if admin exists
    admin = await db.users.find_one({"email": "admin@cic.md"})
    if not admin:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "name": "Administrator CIC",
            "email": "admin@cic.md",
            "phone": "+373 60 000 000",
            "password": hash_password("admin123"),
            "token": generate_token(),
            "is_admin": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Admin user created")
    
    # Check if services exist
    services_count = await db.services.count_documents({})
    if services_count == 0:
        services = [
            {
                "id": str(uuid.uuid4()),
                "name": "Consultație Dentară",
                "description": "Examinare completă a cavității bucale, radiografie și plan de tratament personalizat.",
                "price": "150 MDL",
                "duration": "30 min",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Detartraj și Igienizare",
                "description": "Curățare profesională a dinților, îndepărtarea tartrului și a plăcii bacteriene.",
                "price": "250 MDL",
                "duration": "45 min",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Albire Dentară",
                "description": "Tratament profesional de albire pentru un zâmbet mai strălucitor.",
                "price": "800 MDL",
                "duration": "60 min",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Implant Dentar",
                "description": "Soluție permanentă pentru înlocuirea dinților lipsă cu implanturi din titan.",
                "price": "de la 2500 MDL",
                "duration": "90 min",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Coroană Dentară",
                "description": "Restaurare estetică și funcțională a dinților deteriorați.",
                "price": "de la 800 MDL",
                "duration": "60 min",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Tratament de Canal",
                "description": "Tratament endodontic pentru salvarea dinților afectați de carii profunde.",
                "price": "de la 500 MDL",
                "duration": "60-90 min",
                "created_at": datetime.utcnow()
            }
        ]
        await db.services.insert_many(services)
        logger.info("Services seeded")
    
    # Update existing services to MDL
    await db.services.update_many(
        {"price": {"$regex": "RON"}},
        [{"$set": {"price": {"$replaceAll": {"input": "$price", "find": "RON", "replacement": "MDL"}}}}]
    )
    
    # Check if doctors exist
    doctors_count = await db.doctors.count_documents({})
    if doctors_count == 0:
        doctors = [
            {
                "id": str(uuid.uuid4()),
                "name": "Dr. Maria Popescu",
                "specialization": "Medic Stomatolog Generalist",
                "experience": "15 ani experiență",
                "description": "Specialist în stomatologie generală și estetică dentară.",
                "service_ids": [],
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Dr. Alexandru Ionescu",
                "specialization": "Chirurg Dentar",
                "experience": "12 ani experiență",
                "description": "Expert în chirurgie orală și implantologie.",
                "service_ids": [],
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Dr. Elena Dumitrescu",
                "specialization": "Ortodont",
                "experience": "10 ani experiență",
                "description": "Specialist în ortodonție și corecții dentare.",
                "service_ids": [],
                "created_at": datetime.utcnow()
            }
        ]
        await db.doctors.insert_many(doctors)
        logger.info("Doctors seeded")
    
    return {"message": "Date inițializate cu succes"}

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

# Serve admin panel
@app.get("/api/admin-panel")
async def admin_panel():
    return FileResponse(ROOT_DIR / "static" / "admin.html")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        await seed_data()
    except Exception as e:
        logger.error(f"Error seeding data: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
