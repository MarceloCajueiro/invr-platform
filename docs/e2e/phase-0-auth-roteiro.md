# Roteiro E2E: Phase 0 — Auth & Layouts

## Contexto
Testes da fundação da plataforma Fluent: autenticação (sign-up, sign-in, sign-out), middleware (redirecionamentos), e renderização dos layouts (auth split screen, teacher sidebar, student sidebar).

## Pré-requisitos
- Dev server rodando na porta 3001
- D1 database local com migrations aplicadas
- Banco limpo (sem usuários pré-existentes)

## Cenários

### Auth — Sign Up
#### CT-01: Teacher cria conta com sucesso
- **Dado que** o usuário está na página /sign-up
- **Quando** preenche nome, email e senha (8+ chars) e clica "Criar conta"
- **Então** é redirecionado para /dashboard e vê o sidebar do professor

#### CT-02: Sign-up com senha curta mostra erro
- **Dado que** o usuário está na página /sign-up
- **Quando** preenche nome, email e senha com menos de 8 caracteres
- **Então** o formulário não submete (validação HTML5 minlength)

### Auth — Sign In
#### CT-03: Teacher faz login com credenciais corretas
- **Dado que** existe um teacher cadastrado
- **Quando** acessa /sign-in, preenche email e senha corretos e clica "Entrar"
- **Então** é redirecionado para /dashboard

#### CT-04: Login com credenciais incorretas mostra erro
- **Dado que** o usuário está na página /sign-in
- **Quando** preenche email e senha incorretos e clica "Entrar"
- **Então** vê mensagem de erro na tela

### Auth — Sign Out
#### CT-05: Teacher faz logout
- **Dado que** o teacher está logado no /dashboard
- **Quando** clica em "Sair" no sidebar
- **Então** é redirecionado para /sign-in

### Middleware — Redirecionamentos
#### CT-06: Usuário não autenticado é redirecionado para /sign-in
- **Dado que** o usuário não está autenticado
- **Quando** acessa /dashboard
- **Então** é redirecionado para /sign-in

#### CT-07: Usuário autenticado em /sign-in é redirecionado para /dashboard
- **Dado que** o teacher está autenticado
- **Quando** acessa /sign-in
- **Então** é redirecionado para /dashboard

#### CT-08: Root / redireciona para /dashboard
- **Dado que** o teacher está autenticado
- **Quando** acessa /
- **Então** é redirecionado para /dashboard

### Layout — Auth
#### CT-09: Página de sign-in renderiza layout split screen
- **Dado que** o usuário está na página /sign-in
- **Então** vê o formulário de login com campos email e senha
- **E** vê o heading "Welcome back"

### Layout — Teacher
#### CT-10: Dashboard renderiza sidebar com itens de navegação do professor
- **Dado que** o teacher está logado no /dashboard
- **Então** vê o sidebar com "Fluent" como logo
- **E** vê os itens: Dashboard, Aulas, Tarefas, Posts, Turmas, Alunos
