# ⚖️ JuriSoft - API Backend

> API robusta desenvolvida em Node.js e TypeScript para suportar a plataforma de gestão jurídica JuriSoft. O sistema gerencia o fluxo de dados do escritório, autenticação de usuários, persistência em banco de dados relacional e armazenamento eficiente de arquivos em nuvem.

Este repositório é mantido de forma pública como demonstração de arquitetura, boas práticas de código e domínio de tecnologias backend para avaliação técnica e recrutamento.

## 🚀 Tecnologias e Ferramentas

O backend foi construído com foco em escalabilidade e segurança, utilizando:

- **Ambiente & Linguagem:** ![NodeJS](https://img.shields.io/badge/Node.js_v24+-43853D?style=flat-square&logo=node.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
- **Banco de Dados & ORM:** ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat-square&logo=Prisma&logoColor=white)
- **Armazenamento em Nuvem:** ![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_R2-F38020?style=flat-square&logo=Cloudflare&logoColor=white) (Object Storage)
- **Segurança:** JWT (JSON Web Tokens) com middlewares de autenticação.

## 🏗️ Arquitetura

O projeto adota uma estrutura organizacional baseada na separação de responsabilidades, dividindo a lógica principal em:

- **Controllers:** Responsáveis por receber as requisições HTTP, processar os parâmetros e retornar as respostas.
- **Models:** Representação das entidades do sistema e interação direta com o banco de dados via Prisma.

## ✨ Principais Funcionalidades

- **Autenticação Segura:** Proteção de rotas utilizando middlewares e validação de sessão com JWT.
- **Gestão de Arquivos:** Integração com o Cloudflare R2 para upload de documentos jurídicos e fotos de perfil dos usuários, com controle de limite de armazenamento por plano (`LIMITE_PLANO_GB`).
- **Recuperação de Acesso:** Sistema integrado de envio de e-mails para recuperação de senhas.
- **Setup Inicial Automático:** Criação dinâmica do primeiro usuário administrador (`FIRST_USER_LOGIN` e `FIRST_USER_PASSWORD`) via variáveis de ambiente.

## ⚙️ Configuração do Ambiente Local

### Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina (Versão recomendada: **v24.14.0** ou superior).

### 1. Clonar o repositório

```bash
git clone [https://github.com/MichelRLima/jurisoft_backend.git](https://github.com/MichelRLima/jurisoft_backend.git)
cd jurisoft-backend
```
