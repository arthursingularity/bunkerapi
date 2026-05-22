# Guia Completo de Métodos do Prisma Client

Este guia foi elaborado com base no esquema de banco de dados do seu projeto (**projeto futuro**), utilizando modelos reais como `usuarios`, `empresas`, `categorias`, `produtos` e `vendas`. Ele descreve os métodos mais utilizados do Prisma Client, explicando quando usá-los e fornecendo exemplos práticos.

---

## Índice
1. [Métodos de Busca (Querying)](#1-métodos-de-busca-querying)
   - [`findUnique` / `findUniqueOrThrow`](#findunique--finduniqueorthrow)
   - [`findFirst` / `findFirstOrThrow`](#findfirst--findfirstorthrow)
   - [`findMany`](#findmany)
2. [Métodos de Criação e Atualização (Writing)](#2-métodos-de-criação-e-atualização-writing)
   - [`create` / `createMany`](#create--createmany)
   - [`update` / `updateMany`](#update--updatemany)
   - [`upsert`](#upsert)
3. [Métodos de Exclusão (Deleting)](#3-métodos-de-exclusão-deleting)
   - [`delete` / `deleteMany`](#delete--deletemany)
4. [Métodos de Agregação e Métricas](#4-métodos-de-agregação-e-métricas)
   - [`count`](#count)
   - [`aggregate` / `groupBy`](#aggregate--groupby)

---

## 1. Métodos de Busca (Querying)

### `findUnique` / `findUniqueOrThrow`

Busca um **único** registro que seja estritamente único. Só pode ser usado com campos marcados com `@id` (geralmente `id`) ou `@unique` (como `email` ou `cnpj`) no seu arquivo `schema.prisma`.

*   **Quando usar:** Quando você tem certeza que está buscando por uma chave primária ou campo único e deseja máxima performance.
*   **Diferença com `OrThrow`:** O `findUniqueOrThrow` lança um erro automaticamente se o registro não for encontrado (ótimo para evitar checagens `if (!resultado)` manuais).

#### Exemplo Prático: Buscar um usuário pelo Email (campo `@unique`)
```javascript
// findUnique clássico
const usuario = await prisma.usuarios.findUnique({
    where: {
        email: 'admin@empresa.com'
    }
});

// findUniqueOrThrow (Lança erro se não achar)
try {
    const usuarioObrigatorio = await prisma.usuarios.findUniqueOrThrow({
        where: { id: 5 }
    });
} catch (error) {
    // Trata o erro de registro não encontrado
}
```

---

### `findFirst` / `findFirstOrThrow`

Busca o **primeiro** registro que atende aos critérios de pesquisa fornecidos. Diferente do `findUnique`, ele permite filtrar por **qualquer campo** (mesmo campos que não sejam chaves primárias ou únicos).

*   **Quando usar:** Quando você quer buscar apenas um registro com filtros mais flexíveis (ex: buscar a categoria que pertence a uma empresa específica e tem um determinado ID).
*   **Atenção:** Se houver mais de um registro compatível, ele retornará o primeiro encontrado de acordo com a ordenação padrão ou a especificada por você no `orderBy`.

#### Exemplo Prático: Buscar uma categoria por ID garantindo que ela pertence à empresa do usuário logado
```javascript
const categoria = await prisma.categorias.findFirst({
    where: {
        id: 3,
        empresa_id: req.user.empresa_id // Filtro de segurança multi-inquilino (multi-tenant)
    },
    include: {
        empresas: {
            select: { nome_fantasia: true }
        }
    }
});
```

---

### `findMany`

Busca **múltiplos** registros que atendem aos filtros fornecidos. Retorna uma lista (Array). Se nenhum for encontrado, retorna uma lista vazia `[]`.

*   **Quando usar:** Listagens em geral, relatórios, buscas com paginação ou filtros complexos.
*   **Recursos Úteis:** Suporta `orderBy` (ordenação), `take` (limite), `skip` (pular registros, usado para paginação) e `select` (escolher colunas).

#### Exemplo Prático: Listar produtos ativos de uma empresa ordenados por preço, trazendo apenas 10 itens
```javascript
const produtos = await prisma.produtos.findMany({
    where: {
        empresa_id: req.user.empresa_id,
        ativo: true
    },
    select: {
        id: true,
        nome: true,
        preco_base: true
    },
    orderBy: {
        preco_base: 'asc' // Mais baratos primeiro
    },
    take: 10 // Limite de paginação
});
```

---

## 2. Métodos de Criação e Atualização (Writing)

### `create` / `createMany`

*   `create`: Insere um único registro no banco de dados.
*   `createMany`: Insere múltiplos registros de uma vez em uma única transação no banco (muito mais rápido para inserções em lote).

*   **Quando usar:** Cadastro de novos usuários, produtos, categorias, etc.

#### Exemplo Prático (`create`): Cadastrar uma nova venda associando cliente e vendedor
```javascript
const novaVenda = await prisma.vendas.create({
    data: {
        empresa_id: req.user.empresa_id,
        usuario_id: req.user.id,
        cliente_id: 1, // ID do cliente cadastrado
        valor_total: 159.90,
        forma_pagamento: 'pix',
        status: 'concluida'
    }
});
```

#### Exemplo Prático (`createMany`): Inserir várias variações de tamanho de um produto de uma só vez
```javascript
const novasVariacoes = await prisma.variacoes.createMany({
    data: [
        { tamanho: 'P', cor: 'Preto', qtd_estoque: 10, produto_id: 1 },
        { tamanho: 'M', cor: 'Preto', qtd_estoque: 15, produto_id: 1 },
        { tamanho: 'G', cor: 'Preto', qtd_estoque: 8, produto_id: 1 }
    ]
});
```

---

### `update` / `updateMany`

*   `update`: Atualiza um **único** registro. Exige que a cláusula `where` utilize um campo **único** (geralmente `id`). Retorna o objeto atualizado.
*   `updateMany`: Atualiza **múltiplos** registros que atendem a um filtro. Não precisa de um campo único no `where`. Retorna apenas um objeto com a quantidade de linhas afetadas: `{ count: X }`.

*   **Quando usar `update`:** Atualizar perfil de usuário, alterar preço de um produto específico, mudar status de uma venda pelo ID.
*   **Quando usar `updateMany`:** Desativar em lote produtos fora de estoque, atualizar status de várias vendas antigas.

#### Exemplo Prático (`update`): Atualizar preço de um produto
```javascript
const produtoAtualizado = await prisma.produtos.update({
    where: {
        id: 12 // Precisa ser uma chave única/ID
    },
    data: {
        preco_base: 189.90
    }
});
```

#### Exemplo Prático (`updateMany`): Desativar todos os produtos de uma empresa específica
```javascript
const atualizacaoLote = await prisma.produtos.updateMany({
    where: {
        empresa_id: 4 // Filtro geral
    },
    data: {
        ativo: false // Desativa todos
    }
});
console.log(`Foram desativados ${atualizacaoLote.count} produtos.`);
```

---

### `upsert`

Uma mistura de **Update** + **Insert**. Ele tenta atualizar um registro existente com base em um campo único. Se o registro não existir no banco, ele o cria.

*   **Quando usar:** Sincronização de dados, salvar configurações que podem ou não já existir, garantir que um registro padrão exista no banco.

#### Exemplo Prático: Cadastrar ou Atualizar um usuário com base no e-mail único
```javascript
const usuario = await prisma.usuarios.upsert({
    where: {
        email: 'suporte@empresa.com'
    },
    update: {
        nome: 'Suporte Técnico Atualizado',
        ativo: true
    },
    create: {
        email: 'suporte@empresa.com',
        nome: 'Suporte Técnico',
        senha: 'senha_criptografada_aqui',
        empresa_id: 1,
        cargo: 'suporte'
    }
});
```

---

## 3. Métodos de Exclusão (Deleting)

### `delete` / `deleteMany`

*   `delete`: Exclui um **único** registro. Exige uma chave única no `where`. Retorna o objeto que foi deletado.
*   `deleteMany`: Exclui **múltiplos** registros com base em filtros flexíveis. Retorna apenas `{ count: X }`.

*   **Quando usar:** Quando você precisa fisicamente apagar dados do seu banco (ex: remover uma variação de produto inválida ou limpar dados de teste).
*   *Dica de arquitetura:* Muitas vezes é melhor usar exclusão lógica (alterar o campo `ativo` para `false` com `update`) em vez de deletar fisicamente, para preservar o histórico.

#### Exemplo Prático (`delete`): Excluir uma variação específica de estoque
```javascript
const deletado = await prisma.variacoes.delete({
    where: {
        id: 42 // Deve ser único
    }
});
```

#### Exemplo Prático (`deleteMany`): Deletar todos os produtos inativos de uma determinada categoria
```javascript
const deletados = await prisma.produtos.deleteMany({
    where: {
        categoria_id: 2,
        ativo: false
    }
});
console.log(`Deletados: ${deletados.count}`);
```

---

## 4. Métodos de Agregação e Métricas

### `count`

Conta a quantidade de registros que satisfazem a um critério de busca. Muito mais rápido e consome menos memória do que trazer os registros com `findMany` e ler o `.length`.

*   **Quando usar:** Paginação (para saber o total de páginas), dashboards com contadores estatísticos.

#### Exemplo Prático: Contar o total de vendas concluídas da empresa atual
```javascript
const totalVendas = await prisma.vendas.count({
    where: {
        empresa_id: req.user.empresa_id,
        status: 'concluida'
    }
});
```

---

### `aggregate` / `groupBy`

*   `aggregate`: Permite realizar operações matemáticas como `_sum` (soma), `_avg` (média), `_min` (mínimo) e `_max` (máximo) sobre colunas numéricas de uma tabela.
*   `groupBy`: Faz agregações agrupando os resultados por uma ou mais colunas específicas (similar ao `GROUP BY` do SQL).

*   **Quando usar:** Geração de relatórios financeiros, faturamento de vendas por período, médias de preços por categoria.

#### Exemplo Prático (`aggregate`): Obter o faturamento total e ticket médio de uma empresa
```javascript
const metricasVendas = await prisma.vendas.aggregate({
    where: {
        empresa_id: req.user.empresa_id,
        status: 'concluida'
    },
    _sum: {
        valor_total: true // Soma de todos os valores de venda
    },
    _avg: {
        valor_total: true // Média do valor da venda (ticket médio)
    }
});

console.log('Faturamento Total:', metricasVendas._sum.valor_total);
console.log('Ticket Médio:', metricasVendas._avg.valor_total);
```

#### Exemplo Prático (`groupBy`): Obter o total de vendas faturadas por cada forma de pagamento
```javascript
const vendasPorPagamento = await prisma.vendas.groupBy({
    by: ['forma_pagamento'],
    where: {
        empresa_id: req.user.empresa_id,
        status: 'concluida'
    },
    _sum: {
        valor_total: true
    },
    _count: {
        id: true
    }
});

/*
Resultado será algo como:
[
  { forma_pagamento: 'pix', _sum: { valor_total: 1500.00 }, _count: { id: 10 } },
  { forma_pagamento: 'credito', _sum: { valor_total: 3400.50 }, _count: { id: 12 } }
]
*/
```

---

## 💡 Resumo Rápido de Decisão

| O que você quer fazer? | Qual usar? | Exige campo único no `where`? | Retorno |
| :--- | :--- | :---: | :--- |
| Buscar um único registro pelo **ID / Unique** | `findUnique` | **Sim** | Objeto ou `null` |
| Buscar um registro por **outro campo qualquer** | `findFirst` | Não | Objeto ou `null` |
| Listar **todos** ou **vários** registros | `findMany` | Não | Array `[]` |
| Cadastrar um novo registro | `create` | Não | Objeto cadastrado |
| Atualizar um único registro pelo **ID / Unique** | `update` | **Sim** | Objeto atualizado |
| Atualizar **vários** registros ao mesmo tempo | `updateMany` | Não | `{ count: número }` |
| Criar ou Atualizar se já existir | `upsert` | **Sim** | Objeto resultante |
| Contar quantos registros atendem ao filtro | `count` | Não | Número (inteiro) |
