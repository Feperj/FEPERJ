from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import pymongo
from datetime import datetime, date, timedelta
import json
import os
from bson import ObjectId
import jwt
from passlib.context import CryptContext
import uuid

# Configuração do MongoDB
MONGO_URI = "mongodb+srv://jamarestudo:49912170Lacrimosa1!@familiajamar.wu9knb3.mongodb.net/?retryWrites=true&w=majority&appName=Familiajamar"
DATABASE_NAME = "project0"

# Configuração de segurança
SECRET_KEY = "7qt1DUw9b4p4zKCC"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Sistema FEPERJ", version="1.0.0")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexão com MongoDB
def get_database():
    client = pymongo.MongoClient(MONGO_URI)
    return client[DATABASE_NAME]

# Modelos Pydantic
class Usuario(BaseModel):
    username: str
    password: str
    nome: str
    email: str
    nivel_acesso: str = "usuario"

class Atleta(BaseModel):
    nome: str
    cpf: str
    sexo: str
    email: str
    telefone: Optional[str] = None
    data_nascimento: Optional[str] = None
    data_filiacao: str
    data_desfiliacao: Optional[str] = None
    peso: Optional[float] = None
    altura: Optional[float] = None
    maior_total: Optional[float] = None
    status: str = "ATIVO"
    id_categoria: Optional[str] = None
    id_equipe: Optional[str] = None
    endereco: Optional[str] = None
    observacoes: Optional[str] = None

class Equipe(BaseModel):
    nome: str
    cidade: str
    estado: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    responsavel: Optional[str] = None

class Competicao(BaseModel):
    nome: str
    data_inicio: str
    data_fim: str
    local: str
    descricao: Optional[str] = None
    valor_inscricao: float
    permite_dobra: bool = False
    periodo_inscricao_inicio: str
    periodo_inscricao_fim: str

class Inscricao(BaseModel):
    atleta_id: str
    competicao_id: str
    categorias: List[str]
    valor_pago: float
    status: str = "CONFIRMADA"

# Funções de autenticação
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        return None

def get_current_user(authorization: str = Depends(lambda x: x.headers.get("Authorization"))):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    # Buscar usuário no banco
    db = get_database()
    usuario = db.usuarios.find_one({"username": payload.get("sub")})
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    # Converter ObjectId para string
    usuario["_id"] = str(usuario["_id"])
    return usuario

# Rotas de autenticação
@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    db = get_database()
    usuario = db.usuarios.find_one({"username": username})
    
    if not usuario or not pwd_context.verify(password, usuario["password"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    access_token = create_access_token(data={"sub": usuario["username"]})
    return {"access_token": access_token, "token_type": "bearer", "usuario": usuario}

@app.post("/setup-admin")
async def setup_admin():
    """Cria usuário admin inicial se não existir"""
    try:
        db = get_database()
        
        # Verificar se já existe um admin com as credenciais fixas
        admin = db.usuarios.find_one({"username": "15119236790"})
        if admin:
            return {"message": "Usuário admin já existe"}
        
        # Criar usuário admin com credenciais fixas
        hashed_password = pwd_context.hash("49912170")
        admin_data = {
            "username": "15119236790",
            "password": hashed_password,
            "nome": "Administrador FEPERJ",
            "email": "admin@feperj.com",
            "nivel_acesso": "admin",
            "data_criacao": datetime.utcnow()
        }
        
        result = db.usuarios.insert_one(admin_data)
        return {"message": "Usuário admin criado com sucesso", "id": str(result.inserted_id)}
    except Exception as e:
        print(f"Erro ao criar admin: {e}")
        return {"message": f"Erro ao criar admin: {str(e)}"}

@app.post("/usuarios")
async def criar_usuario(usuario: Usuario):
    db = get_database()
    
    # Verificar se usuário já existe
    if db.usuarios.find_one({"username": usuario.username}):
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    # Hash da senha
    hashed_password = pwd_context.hash(usuario.password)
    
    usuario_data = usuario.dict()
    usuario_data["password"] = hashed_password
    usuario_data["data_criacao"] = datetime.utcnow()
    
    result = db.usuarios.insert_one(usuario_data)
    return {"id": str(result.inserted_id), "message": "Usuário criado com sucesso"}

# Rotas de atletas
@app.get("/atletas")
async def listar_atletas(current_user: dict = Depends(get_current_user)):
    db = get_database()
    atletas = list(db.atletas.find())
    
    # Converter ObjectId para string
    for atleta in atletas:
        atleta["_id"] = str(atleta["_id"])
        if "id_equipe" in atleta and atleta["id_equipe"]:
            equipe = db.equipes.find_one({"_id": ObjectId(atleta["id_equipe"])})
            atleta["nome_equipe"] = equipe["nome"] if equipe else None
    
    return atletas

@app.post("/atletas")
async def criar_atleta(atleta: Atleta, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Verificar se CPF já existe
    if db.atletas.find_one({"cpf": atleta.cpf}):
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    atleta_data = atleta.dict()
    atleta_data["data_criacao"] = datetime.utcnow()
    atleta_data["matricula"] = gerar_matricula(atleta.cpf)
    
    result = db.atletas.insert_one(atleta_data)
    return {"id": str(result.inserted_id), "message": "Atleta criado com sucesso"}

@app.put("/atletas/{atleta_id}")
async def atualizar_atleta(atleta_id: str, atleta: Atleta, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Verificar se atleta existe
    if not db.atletas.find_one({"_id": ObjectId(atleta_id)}):
        raise HTTPException(status_code=404, detail="Atleta não encontrado")
    
    atleta_data = atleta.dict()
    atleta_data["data_atualizacao"] = datetime.utcnow()
    
    db.atletas.update_one({"_id": ObjectId(atleta_id)}, {"$set": atleta_data})
    return {"message": "Atleta atualizado com sucesso"}

@app.delete("/atletas/{atleta_id}")
async def deletar_atleta(atleta_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    result = db.atletas.delete_one({"_id": ObjectId(atleta_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Atleta não encontrado")
    
    return {"message": "Atleta deletado com sucesso"}

# Rotas de equipes
@app.get("/equipes")
async def listar_equipes(current_user: dict = Depends(get_current_user)):
    db = get_database()
    equipes = list(db.equipes.find())
    
    for equipe in equipes:
        equipe["_id"] = str(equipe["_id"])
        # Contar atletas da equipe
        count = db.atletas.count_documents({"id_equipe": str(equipe["_id"])})
        equipe["total_atletas"] = count
    
    return equipes

@app.post("/equipes")
async def criar_equipe(equipe: Equipe, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Verificar se equipe já existe
    if db.equipes.find_one({"nome": equipe.nome}):
        raise HTTPException(status_code=400, detail="Equipe já existe")
    
    equipe_data = equipe.dict()
    equipe_data["data_criacao"] = datetime.utcnow()
    
    result = db.equipes.insert_one(equipe_data)
    return {"id": str(result.inserted_id), "message": "Equipe criada com sucesso"}

@app.put("/equipes/{equipe_id}")
async def atualizar_equipe(equipe_id: str, equipe: Equipe, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    if not db.equipes.find_one({"_id": ObjectId(equipe_id)}):
        raise HTTPException(status_code=404, detail="Equipe não encontrada")
    
    equipe_data = equipe.dict()
    equipe_data["data_atualizacao"] = datetime.utcnow()
    
    db.equipes.update_one({"_id": ObjectId(equipe_id)}, {"$set": equipe_data})
    return {"message": "Equipe atualizada com sucesso"}

@app.delete("/equipes/{equipe_id}")
async def deletar_equipe(equipe_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Verificar se há atletas na equipe
    count = db.atletas.count_documents({"id_equipe": equipe_id})
    if count > 0:
        raise HTTPException(status_code=400, detail="Não é possível deletar equipe com atletas")
    
    result = db.equipes.delete_one({"_id": ObjectId(equipe_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipe não encontrada")
    
    return {"message": "Equipe deletada com sucesso"}

# Rotas de competições
@app.get("/competicoes")
async def listar_competicoes(current_user: dict = Depends(get_current_user)):
    db = get_database()
    competicoes = list(db.competicoes.find())
    
    for competicao in competicoes:
        competicao["_id"] = str(competicao["_id"])
        # Contar inscrições
        count = db.inscricoes.count_documents({"competicao_id": str(competicao["_id"])})
        competicao["total_inscricoes"] = count
    
    return competicoes

@app.post("/competicoes")
async def criar_competicao(competicao: Competicao, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    competicao_data = competicao.dict()
    competicao_data["data_criacao"] = datetime.utcnow()
    
    result = db.competicoes.insert_one(competicao_data)
    return {"id": str(result.inserted_id), "message": "Competição criada com sucesso"}

@app.put("/competicoes/{competicao_id}")
async def atualizar_competicao(competicao_id: str, competicao: Competicao, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    if not db.competicoes.find_one({"_id": ObjectId(competicao_id)}):
        raise HTTPException(status_code=404, detail="Competição não encontrada")
    
    competicao_data = competicao.dict()
    competicao_data["data_atualizacao"] = datetime.utcnow()
    
    db.competicoes.update_one({"_id": ObjectId(competicao_id)}, {"$set": competicao_data})
    return {"message": "Competição atualizada com sucesso"}

@app.delete("/competicoes/{competicao_id}")
async def deletar_competicao(competicao_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Verificar se há inscrições
    count = db.inscricoes.count_documents({"competicao_id": competicao_id})
    if count > 0:
        raise HTTPException(status_code=400, detail="Não é possível deletar competição com inscrições")
    
    result = db.competicoes.delete_one({"_id": ObjectId(competicao_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Competição não encontrada")
    
    return {"message": "Competição deletada com sucesso"}

# Rotas de inscrições
@app.get("/inscricoes")
async def listar_inscricoes(current_user: dict = Depends(get_current_user)):
    db = get_database()
    inscricoes = list(db.inscricoes.find())
    
    for inscricao in inscricoes:
        inscricao["_id"] = str(inscricao["_id"])
        # Buscar dados do atleta
        atleta = db.atletas.find_one({"_id": ObjectId(inscricao["atleta_id"])})
        inscricao["atleta_nome"] = atleta["nome"] if atleta else "N/A"
        
        # Buscar dados da competição
        competicao = db.competicoes.find_one({"_id": ObjectId(inscricao["competicao_id"])})
        inscricao["competicao_nome"] = competicao["nome"] if competicao else "N/A"
    
    return inscricoes

@app.post("/inscricoes")
async def criar_inscricao(inscricao: Inscricao, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    inscricao_data = inscricao.dict()
    inscricao_data["data_inscricao"] = datetime.utcnow()
    
    result = db.inscricoes.insert_one(inscricao_data)
    return {"id": str(result.inserted_id), "message": "Inscrição criada com sucesso"}

@app.delete("/inscricoes/{inscricao_id}")
async def cancelar_inscricao(inscricao_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    result = db.inscricoes.delete_one({"_id": ObjectId(inscricao_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada")
    
    return {"message": "Inscrição cancelada com sucesso"}

# Rotas de relatórios
@app.get("/relatorios/dashboard")
async def dashboard(current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    total_atletas = db.atletas.count_documents({})
    total_equipes = db.equipes.count_documents({})
    total_competicoes = db.competicoes.count_documents({})
    total_inscricoes = db.inscricoes.count_documents({})
    
    # Atletas por equipe
    pipeline = [
        {"$lookup": {"from": "equipes", "localField": "id_equipe", "foreignField": "_id", "as": "equipe"}},
        {"$group": {"_id": "$id_equipe", "count": {"$sum": 1}, "equipe_nome": {"$first": "$equipe.nome"}}},
        {"$sort": {"count": -1}}
    ]
    atletas_por_equipe = list(db.atletas.aggregate(pipeline))
    
    return {
        "totais": {
            "atletas": total_atletas,
            "equipes": total_equipes,
            "competicoes": total_competicoes,
            "inscricoes": total_inscricoes
        },
        "atletas_por_equipe": atletas_por_equipe
    }

# Função auxiliar para gerar matrícula
def gerar_matricula(cpf):
    # Remover caracteres não numéricos
    cpf_limpo = ''.join(filter(str.isdigit, cpf))
    # Pegar últimos 4 dígitos
    ultimos_digitos = cpf_limpo[-4:]
    # Gerar timestamp
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"FEP{timestamp}{ultimos_digitos}"

# Rota de health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Sistema FEPERJ funcionando"}

# Rota para servir arquivos estáticos
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def root():
    return FileResponse("frontend/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
