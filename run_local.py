#!/usr/bin/env python3
"""
Script para executar o Sistema FEPERJ localmente
"""

import os
import sys
import subprocess
import webbrowser
from pathlib import Path

def check_python_version():
    """Verificar se a versão do Python é compatível"""
    if sys.version_info < (3, 8):
        print("❌ Erro: Python 3.8 ou superior é necessário")
        print(f"Versão atual: {sys.version}")
        return False
    print(f"✅ Python {sys.version.split()[0]} detectado")
    return True

def install_requirements():
    """Instalar dependências Python"""
    print("📦 Instalando dependências...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"
        ])
        print("✅ Dependências instaladas com sucesso")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar dependências: {e}")
        return False

def create_env_file():
    """Criar arquivo .env se não existir"""
    env_file = Path(".env")
    if not env_file.exists():
        print("🔧 Criando arquivo .env...")
        env_content = """MONGO_URI=mongodb+srv://jamarestudo:49912170Lacrimosa1!@familiajamar.wu9knb3.mongodb.net/?retryWrites=true&w=majority&appName=Familiajamar
DATABASE_NAME=project0
SECRET_KEY=7qt1DUw9b4p4zKCC
"""
        env_file.write_text(env_content)
        print("✅ Arquivo .env criado")
    else:
        print("✅ Arquivo .env já existe")

def start_server():
    """Iniciar o servidor FastAPI"""
    print("🚀 Iniciando servidor...")
    print("📍 URL: http://localhost:8000")
    print("📖 Documentação da API: http://localhost:8000/docs")
    print("🔄 Pressione Ctrl+C para parar o servidor")
    print("-" * 50)
    
    try:
        # Mudar para o diretório backend
        os.chdir("backend")
        
        # Iniciar o servidor
        subprocess.run([
            sys.executable, "-m", "uvicorn", "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo usuário")
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")

def open_browser():
    """Abrir navegador automaticamente"""
    try:
        webbrowser.open("http://localhost:8000")
        print("🌐 Navegador aberto automaticamente")
    except:
        print("⚠️ Não foi possível abrir o navegador automaticamente")

def main():
    """Função principal"""
    print("=" * 60)
    print("🏋️ SISTEMA FEPERJ - CONFIGURAÇÃO LOCAL")
    print("=" * 60)
    
    # Verificar versão do Python
    if not check_python_version():
        sys.exit(1)
    
    # Verificar se estamos no diretório correto
    if not Path("backend").exists() or not Path("frontend").exists():
        print("❌ Erro: Execute este script no diretório raiz do projeto (feperj-web)")
        sys.exit(1)
    
    # Instalar dependências
    if not install_requirements():
        sys.exit(1)
    
    # Criar arquivo .env
    create_env_file()
    
    print("\n🎯 Configuração concluída!")
    print("\n📋 Informações importantes:")
    print("• Usuário padrão: admin")
    print("• Senha padrão: admin123")
    print("• Altere a senha após o primeiro login!")
    
    # Perguntar se quer abrir o navegador
    try:
        response = input("\n🌐 Abrir navegador automaticamente? (s/n): ").lower()
        if response in ['s', 'sim', 'y', 'yes']:
            open_browser()
    except:
        pass
    
    print("\n" + "=" * 60)
    
    # Iniciar servidor
    start_server()

if __name__ == "__main__":
    main()
