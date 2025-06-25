# Charms Reference - DeepCode Framework v0.0.5

**Complete reference for all 50 essential primitive charms** available in the framework, organized by tiers and functionality.

## 🎯 Charm Philosophy

Charms are **essential primitives** that provide direct access to Discord's API and basic tools so you can build any functionality you desire.

## Tier 1 - Basic Primitives (20 charms)

### 🔍 Information (6 charms)
- **`$avatar`** - Get user/server avatars with customizable sizes and formats
- **`$user`** - Comprehensive user information and data retrieval
- **`$server`** - Server information, statistics, and metadata
- **`$mention`** - Handle, validate, and parse Discord mentions
- **`$ping`** - Bot latency, API response times, and connection status
- **`$uptime`** - Bot uptime, process information, and runtime statistics

### 🛡️ Moderation (7 charms)
- **`$ban`** - Ban users with reasons, duration, and message deletion options
- **`$kick`** - Kick users from server with customizable reasons
- **`$timeout`** - Apply Discord native timeouts with duration control
- **`$mute`** / **`$unmute`** - Role-based muting system with custom roles
- **`$warn`** - Comprehensive warning system with persistence and escalation
- **`$purge`** - Bulk message deletion with filters and conditions
- **`$slowmode`** - Configure channel slowmode with validation and limits

### 💬 Communication (4 charms)
- **`$say`** - Send messages with content, embeds, and file attachments
- **`$embed`** - Create rich embeds with full Discord embed specification
- **`$dm`** - Send direct messages with error handling and validation
- **`$reply`** - Reply to messages with mention control and threading

### 🔧 Utilities (3 charms)
- **`$random`** - Generate random numbers, choices, and weighted selections
- **`$math`** - Mathematical operations, calculations, and number formatting
- **`$time`** - Time manipulation, formatting, parsing, and timezone handling

## Tier 2 - Intermediate Primitives (20 charms)

### 📋 Server Management (8 charms)
- **`$channel`** - Complete CRUD operations for channels with permissions and settings
- **`$role`** - Full role management including creation, modification, and assignment
- **`$member`** - Comprehensive member management and server operations
- **`$permission`** - Advanced permission management for roles and channels
- **`$invite`** - Create, manage, and track server invites with analytics
- **`$emoji`** - Custom emoji management including upload and modification
- **`$webhook`** - Webhook creation, management, and message sending
- **`$category`** - Channel category management and organization

### 🗄️ Data & Persistence (4 charms)
- **`$data`** - Variable storage, persistence, and data operations
- **`$json`** - JSON parsing, manipulation, and validation
- **`$file`** - File operations including read, write, and download capabilities
- **`$cache`** - Memory caching with TTL, expiration, and cleanup

### 📊 Logging & Analytics (4 charms)
- **`$log`** - Multi-level logging system with file and channel output
- **`$audit`** - Discord audit log access and filtering
- **`$track`** - Event tracking, analytics, and user behavior monitoring
- **`$history`** - Message history retrieval, search, and analysis

### 🔗 Interactions (4 charms)
- **`$button`** - Interactive button creation with styles and callbacks
- **`$select`** - Selection menus with options, validation, and responses
- **`$modal`** - Modal form creation with input fields and validation
- **`$reaction`** - Reaction management, monitoring, and user tracking

## Tier 3 - Advanced Primitives (10 charms)

### 🔄 Flow Control (6 charms)
- **`$condition`** - Advanced conditional logic with complex expressions
- **`$loop`** - Loops, iterations, and control flow management
- **`$wait`** - Delays, timeouts, and conditional waiting
- **`$schedule`** - Task scheduling with cron-like functionality
- **`$event`** - Custom event system and Discord event handling
- **`$trigger`** - Conditional triggers and automation rules

### 📊 Data Manipulation (4 charms)
- **`$array`** - Comprehensive array operations and transformations
- **`$string`** - Advanced string manipulation and formatting
- **`$regex`** - Regular expression matching, replacement, and validation
- **`$validate`** - Data validation with custom rules and schemas

## Exemplos de Uso

### Comando de Moderação Simples
```javascript
client.CharmRegisterCommand({
    name: 'ban',
    description: 'Banir usuário',
    code: `$ban[$$mention, $$args[1]]`
});
```

### Sistema de Pontos (Usando Primitivas)
```javascript
client.CharmRegisterCommand({
    name: 'points',
    description: 'Ver pontos',
    code: `$embed[{
        "title": "Seus Pontos",
        "description": "Você tem $data[user_$$author.id_points] pontos!",
        "color": "GREEN"
    }]`
});

client.CharmRegisterCommand({
    name: 'addpoints',
    description: 'Adicionar pontos',
    code: `$data[add, user_$$mention.id_points, $$args[1]]
           $say[Adicionados $$args[1] pontos para $$mention!]`
});
```

### Sistema de Boas-vindas (Usando Primitivas)
```javascript
client.CharmRegisterCommand({
    name: 'welcome',
    description: 'Dar boas-vindas',
    code: `$embed[{
        "title": "Bem-vindo!",
        "description": "Bem-vindo ao servidor, $$mention!",
        "color": "$random[type: color]",
        "timestamp": "$time[iso]"
    }]
    $role[add, $$mention, Membro]`
});
```

### Quiz Simples (Usando Primitivas)
```javascript
client.CharmRegisterCommand({
    name: 'quiz',
    description: 'Quiz matemático',
    code: `$condition[{
        "left": "$$args[0]",
        "operator": "==",
        "right": "$math[add, $random[1,10], $random[1,10]]",
        "then": "$say[Correto! +10 pontos] $data[add, user_$$author.id_points, 10]",
        "else": "$say[Errado! Tente novamente.]"
    }]`
});
```

## 🎯 Vantagens das Primitivas

### ✅ **Liberdade Total**
- Crie qualquer funcionalidade que imaginar
- Não está limitado a sistemas pré-definidos
- Combine primitivas de formas criativas

### ✅ **Reutilização**
- Use as mesmas primitivas para diferentes funcionalidades
- Código mais limpo e organizado
- Fácil manutenção

### ✅ **Aprendizado**
- Entenda como os sistemas funcionam por baixo
- Desenvolva lógica de programação
- Crie soluções personalizadas

## 📊 **Resumo dos 50 Charms**

### **Por Tier:**
- **Tier 1**: 20 charms (Primitivas básicas)
- **Tier 2**: 20 charms (Primitivas intermediárias)
- **Tier 3**: 10 charms (Primitivas avançadas)

### **Por Categoria:**
- **Informações**: 6 charms (avatar, user, server, mention, ping, uptime)
- **Moderação**: 7 charms (ban, kick, timeout, mute, warn, purge, slowmode)
- **Comunicação**: 4 charms (say, embed, dm, reply)
- **Utilitários**: 3 charms (random, math, time)
- **Gerenciamento**: 8 charms (channel, role, member, permission, invite, emoji, webhook, category)
- **Persistência**: 4 charms (data, json, file, cache)
- **Logs**: 4 charms (log, audit, track, history)
- **Interações**: 4 charms (button, select, modal, reaction)
- **Controle de Fluxo**: 6 charms (condition, loop, wait, schedule, event, trigger)
- **Manipulação**: 4 charms (array, string, regex, validate)

## 🚀 **Resultado Final**

Com **50 primitivas essenciais**, você pode criar:
- ✅ **Sistemas de economia** completos e personalizados
- ✅ **Jogos interativos** únicos e envolventes
- ✅ **Moderação avançada** totalmente automatizada
- ✅ **Bots de música** com funcionalidades customizadas
- ✅ **Sistemas de níveis** e ranking personalizados
- ✅ **Dashboards interativos** com botões e menus
- ✅ **Sistemas de tickets** avançados
- ✅ **Automação completa** de servidores
- ✅ **E literalmente qualquer coisa** que conseguir imaginar!

**A diferença:** Você constrói exatamente o que precisa, do jeito que quer, sem limitações.
