# Sistema de Cadastro Web - Versão Final

## 📋 Descrição
Sistema completo de cadastro web com dashboard administrativo, captura de fotos, geolocalização e autenticação JWT.

## 🌐 URL de Demonstração
**Sistema Funcionando:** https://9yhyi3cznlqg.manus.space/

## 🔐 Acesso Administrativo
- **URL:** https://9yhyi3cznlqg.manus.space/admin-login.html
- **Usuário:** admin
- **Senha:** admin123

## 🚀 Funcionalidades

### Frontend (Usuário)
- ✅ Formulário de cadastro com validação em tempo real
- ✅ Máscaras automáticas (CPF, telefone)
- ✅ Captura de 4 fotos sequenciais via câmera
- ✅ Geolocalização automática para cada foto
- ✅ Interface responsiva e moderna

### Dashboard Administrativo
- ✅ Login seguro com JWT (sem expiração)
- ✅ Visualização de todos os cadastros
- ✅ Métricas em tempo real
- ✅ Gestão de usuários administrativos
- ✅ Mapa com localizações dos cadastros
- ✅ Links para Google Maps
- ✅ Visualização de fotos capturadas

## 📁 Estrutura do Projeto

```
cadastro_backend_fixed/
├── src/
│   ├── main.py              # Aplicação principal Flask
│   ├── models/
│   │   ├── admin.py         # Modelos do banco (Admin, Registration)
│   │   └── user.py          # Modelo de usuário
│   ├── routes/
│   │   ├── admin.py         # Rotas administrativas
│   │   ├── public.py        # Rotas públicas
│   │   └── user.py          # Rotas de usuário
│   ├── static/              # Frontend (HTML, CSS, JS)
│   │   ├── index.html       # Página inicial de cadastro
│   │   ├── capture-photo-*.html  # Páginas de captura de fotos
│   │   ├── admin-login.html # Login administrativo
│   │   ├── admin-dashboard.html # Dashboard administrativo
│   │   └── *.js, *.css      # Scripts e estilos
│   └── database/
│       └── app.db           # Banco SQLite
├── requirements.txt         # Dependências Python
└── README.md               # Esta documentação
```

## 🛠️ Instalação e Execução

### 1. Instalar Dependências
```bash
pip install -r requirements.txt
```

### 2. Executar o Sistema
```bash
cd src/
python main.py
```

### 3. Acessar o Sistema
- **Frontend:** http://localhost:3000/
- **Admin:** http://localhost:3000/admin-login.html

## 🔧 Configurações Técnicas

### Backend
- **Framework:** Flask
- **Banco de Dados:** SQLite
- **Autenticação:** JWT (sem expiração)
- **CORS:** Habilitado para todas as origens
- **Porta:** 3000

### Frontend
- **Tecnologias:** HTML5, CSS3, JavaScript ES6
- **Estilo:** Tailwind CSS
- **Responsivo:** Sim
- **Câmera:** getUserMedia API
- **Geolocalização:** Geolocation API

## 📊 Endpoints da API

### Públicos
- `GET /` - Página inicial
- `POST /register` - Cadastro de usuário

### Administrativos (Requer JWT)
- `POST /admin/login` - Login administrativo
- `GET /admin/dashboard` - Dados do dashboard
- `GET /admin/registrations` - Lista de cadastros

## 🔒 Segurança
- Autenticação JWT sem expiração
- Validação de dados no frontend e backend
- CORS configurado adequadamente
- Senhas hasheadas (bcrypt)

## 🐛 Problemas Resolvidos
- ✅ Logout automático corrigido
- ✅ Erro HTTP 422 eliminado
- ✅ Configuração JWT unificada
- ✅ Integração frontend-backend funcionando
- ✅ Sessões persistentes

## 📝 Notas de Desenvolvimento
- Sistema testado e funcionando em produção
- Configuração otimizada para deploy
- Logs de debug implementados
- Tratamento robusto de erros

---
**Desenvolvido com Flask + JavaScript | Sistema Completo e Funcional**

