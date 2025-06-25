# Base Final do DeepCode Framework v0.0.4

## 🎯 **Transformação Completa**

O framework foi **completamente reformulado** seguindo a nova filosofia:

### ❌ **ANTES (Funcionalidades Prontas)**
- 47+ charms com soluções pré-definidas
- Sistemas de jogos, economia, música prontos
- Limitava a criatividade do usuário
- Funcionalidades específicas e inflexíveis

### ✅ **AGORA (Primitivas Essenciais)**
- 21 charms com primitivas do Discord
- Ferramentas básicas para construir qualquer coisa
- Liberdade total para criar
- Blocos de construção flexíveis

## 📋 **Charms Disponíveis (21 Total)**

### **Tier 1 - Primitivas Básicas (10 charms)**

#### 🛡️ Moderação (7 charms)
- `$ban` - Banir usuários
- `$kick` - Expulsar usuários
- `$timeout` - Timeout nativo do Discord
- `$mute` / `$unmute` - Silenciamento por role
- `$warn` - Sistema de avisos
- `$purge` - Limpeza de mensagens

#### 💬 Comunicação (2 charms)
- `$say` - Mensagens simples
- `$embed` - Embeds formatados

#### 🔧 Utilitários (3 charms)
- `$random` - Números e escolhas aleatórias
- `$math` - Operações matemáticas
- `$time` - Manipulação de tempo

### **Tier 2 - Primitivas Intermediárias (6 charms)**

#### 📋 Gerenciamento (4 charms)
- `$channel` - CRUD de canais
- `$role` - CRUD de roles
- `$member` - Gerenciamento de membros
- `$permission` - Gerenciamento de permissões

#### 🗄️ Persistência (2 charms)
- `$data` - Variáveis e persistência
- `$json` - Manipulação de JSON

### **Tier 3 - Primitivas Avançadas (5 charms)**

#### 🔄 Controle de Fluxo
- `$condition` - Lógica condicional
- `$if` / `$else` / `$elseif` - Condicionais
- `$loop` / `$while` / `$foreach` - Loops

#### 📊 Manipulação de Dados
- `$array` - Operações com arrays
- `$string` - Manipulação de strings

## 🚀 **Exemplos Práticos**

### **Sistema de Economia (Usando Primitivas)**
```javascript
// Comando para ver pontos
client.CharmRegisterCommand({
    name: 'pontos',
    code: `$embed[{
        "title": "💰 Seus Pontos",
        "description": "Você tem $data[user_$$author.id_points] pontos!",
        "color": "GOLD"
    }]`
});

// Comando para trabalhar (ganhar pontos)
client.CharmRegisterCommand({
    name: 'trabalhar',
    code: `$data[add, user_$$author.id_points, $random[50,200]]
           $say[💼 Você trabalhou e ganhou $random[50,200] pontos!]`
});

// Loja simples
client.CharmRegisterCommand({
    name: 'comprar',
    code: `$condition[{
        "left": "$data[user_$$author.id_points]",
        "operator": ">=",
        "right": "1000",
        "then": "$data[sub, user_$$author.id_points, 1000] $say[✅ Compra realizada!]",
        "else": "$say[❌ Pontos insuficientes!]"
    }]`
});
```

### **Sistema de Níveis (Usando Primitivas)**
```javascript
// Ganhar XP por mensagem
client.CharmRegisterCommand({
    name: 'xp',
    code: `$data[add, user_$$author.id_xp, $random[10,25]]
           $condition[{
               "left": "$data[user_$$author.id_xp]",
               "operator": ">=",
               "right": "$math[mul, $data[user_$$author.id_level], 100]",
               "then": "$data[inc, user_$$author.id_level] $say[🎉 $$author subiu para o nível $data[user_$$author.id_level]!]"
           }]`
});
```

### **Quiz Matemático (Usando Primitivas)**
```javascript
client.CharmRegisterCommand({
    name: 'quiz',
    code: `$data[set, quiz_$$author.id_answer, $math[add, $random[1,50], $random[1,50]]]
           $say[🧮 Quanto é $random[1,50] + $random[1,50]? Digite !resposta <número>]`
});

client.CharmRegisterCommand({
    name: 'resposta',
    code: `$condition[{
        "left": "$$args[0]",
        "operator": "==",
        "right": "$data[quiz_$$author.id_answer]",
        "then": "$say[✅ Correto! +100 pontos] $data[add, user_$$author.id_points, 100]",
        "else": "$say[❌ Errado! A resposta era $data[quiz_$$author.id_answer]]"
    }]`
});
```

### **Sistema de Moderação Avançado (Usando Primitivas)**
```javascript
// Auto-moderação por palavrões
client.CharmRegisterCommand({
    name: 'automod',
    code: `$condition[{
        "left": "$$message.content",
        "operator": "includes",
        "right": "palavrão",
        "then": "$purge[1] $warn[$$author, Linguagem inadequada] $timeout[$$author, 5m]"
    }]`
});

// Sistema de warns com punições automáticas
client.CharmRegisterCommand({
    name: 'warn',
    code: `$data[inc, warns_$$mention.id]
           $condition[{
               "left": "$data[warns_$$mention.id]",
               "operator": ">=",
               "right": "3",
               "then": "$ban[$$mention, Muitos avisos] $say[$$mention foi banido por acumular 3 avisos]",
               "else": "$say[⚠️ $$mention recebeu um aviso. Total: $data[warns_$$mention.id]/3]"
           }]`
});
```

## 🎯 **Vantagens da Nova Base**

### ✅ **Liberdade Total**
- Crie **qualquer** funcionalidade que imaginar
- Não está limitado a sistemas pré-definidos
- Combine primitivas de formas criativas

### ✅ **Aprendizado Real**
- Entenda como os sistemas funcionam
- Desenvolva lógica de programação
- Crie soluções personalizadas

### ✅ **Flexibilidade Máxima**
- Adapte às necessidades específicas do seu servidor
- Modifique e expanda facilmente
- Reutilize código entre diferentes funcionalidades

### ✅ **Performance Otimizada**
- Apenas 21 charms carregados
- Sem funcionalidades desnecessárias
- Framework mais leve e rápido

## 🚀 **Resultado Final**

Com apenas **21 primitivas essenciais**, você pode criar:

- ✅ **Sistemas de economia** completos e personalizados
- ✅ **Jogos interativos** únicos
- ✅ **Moderação avançada** automatizada
- ✅ **Sistemas de níveis** customizados
- ✅ **Bots de utilidade** específicos
- ✅ **E literalmente qualquer coisa** que conseguir imaginar!

**A diferença:** Você constrói exatamente o que precisa, do jeito que quer, sem limitações.

---

**DeepCode Framework v0.0.4** - Primitivas essenciais para liberdade total! 🎯
