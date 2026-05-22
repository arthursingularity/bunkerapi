# Guia Passo a Passo: Adicionando a Coluna 'marca' na Tabela de Produtos

Este documento explica de forma detalhada o passo a passo para adicionar o campo `marca` à tabela `produtos` utilizando o **Prisma ORM** e como garantir que essa nova informação seja manipulada e retornada corretamente na sua API (`produtoController.js`).

---

## 🚀 Resumo do Processo
Como o Prisma realiza o mapeamento direto de banco de dados para objetos JavaScript, o processo consiste em:
1. **Modificar o schema do Prisma** para definir o novo campo.
2. **Atualizar o banco de dados físico** (PostgreSQL) com a nova coluna.
3. **Regenerar o Prisma Client** para que ele conheça a nova propriedade no código.
4. **Atualizar os controllers** para permitir a gravação/atualização do novo campo (opcional, porém recomendado).

---

## 🛠️ Passo 1: Atualizar o Schema do Prisma (`schema.prisma`)
Abra o arquivo `backend/prisma/schema.prisma` e localize o bloco `model produtos`.

Adicione o campo `marca` ao modelo. Como é um campo de texto para a marca do produto, ele pode ser opcional (`String?`) para não quebrar os registros já existentes no seu banco de dados.

```prisma
model produtos {
  id         Int         @id @default(autoincrement())
  nome       String      @db.VarChar(255)
  descricao  String?
  marca      String?     @db.VarChar(100) // 🟢 Adicione esta linha!
  preco_base Decimal     @db.Decimal(10, 2)
  ativo      Boolean?    @default(true)
  createdAt  DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt  DateTime    @default(now()) @db.Timestamptz(6)
  empresa_id Int?
  empresas   empresas?   @relation(fields: [empresa_id], references: [id], onDelete: Cascade)
  variacoes  variacoes[]
}
```

### 💡 Por que fazer isso?
O arquivo `schema.prisma` é a única fonte de verdade da sua estrutura de dados. O Prisma utiliza este arquivo para gerar as tipagens e entender quais propriedades existem em cada tabela.

---

## 🛠️ Passo 2: Sincronizar com o Banco de Dados
Agora você precisa refletir essa mudança no seu banco de dados real. Existem duas abordagens principais:

### Opção A: Utilizando `db push` (Recomendado para Desenvolvimento Rápido)
Se você não está usando migrações estritas baseadas em arquivos SQL, o comando mais simples para atualizar o banco local é:
```bash
npx prisma db push
```
* **O que faz?** Ele analisa o seu `schema.prisma`, detecta que a coluna `marca` não existe na tabela `produtos` do PostgreSQL e a cria diretamente lá, sem apagar os seus dados atuais.

### Opção B: Alterando diretamente no Banco (Via SQL)
Se preferir rodar comandos SQL manualmente no seu cliente PostgreSQL (como DBeaver, pgAdmin, etc.):
```sql
ALTER TABLE produtos ADD COLUMN marca VARCHAR(100);
```
* **O que faz?** Cria a coluna de texto fisicamente. Se fizer por esta opção, você precisará rodar o comando abaixo em seguida para garantir que o Prisma se sincronize:
  ```bash
  npx prisma db pull
  ```

---

## 🛠️ Passo 3: Regenerar o Prisma Client
Sempre que o esquema mudar e o banco de dados for sincronizado, você precisa reconstruir os arquivos internos do Prisma executando:
```bash
npx prisma generate
```
### 💡 Por que fazer isso?
Este comando reconstrói a pasta `node_modules/@prisma/client` com as novas definições de tipo. A partir deste momento, quando você digitar `prisma.produtos.`, o autocompleta do seu editor exibirá a opção `marca`.

---

## 🛠️ Passo 4: Entendendo o comportamento no `produtoController.js`

Aqui está a excelente notícia sobre o seu controller atual: **você não precisa fazer nenhuma alteração nas requisições GET (`listarProdutos` e `obterProdutoPorId`) para que a marca seja exibida!** 

### 💡 Por que a requisição GET já funciona automaticamente?
No seu `produtoController.js`, as consultas GET foram escritas da seguinte forma:
```javascript
const produtos = await prisma.produtos.findMany({
    where: { empresa_id: req.user.empresa_id },
    include: {
        variacoes: {
            select: { id: true, tamanho: true, cor: true, qtd_estoque: true }
        }
    },
    orderBy: { id: 'desc' }
});
```

Como **não** há uma cláusula `select` explícita delimitando as colunas do produto (apenas um `include` para trazer as variações), o Prisma por padrão **seleciona todas as colunas existentes** na tabela `produtos`. 
Portanto, assim que o passo 3 for concluído, a propriedade `marca` já virá preenchida (ou como `null` para os produtos antigos) em todas as listagens JSON automaticamente!

---

## 🛠️ Passo 5 (Extra): Como salvar e editar a marca?
Para que a coluna seja útil, você precisará permitir que ela seja enviada no cadastro e na edição do produto. Veja onde você deve adicionar o campo no seu controller:

### 1. No Cadastro (`criarProduto`):
No topo da função `criarProduto`, destruture `marca` do corpo da requisição e envie no objeto `data`:
```diff
const criarProduto = async (req, res) => {
-   const { nome, descricao, preco_base, variacoes } = req.body;
+   const { nome, descricao, marca, preco_base, variacoes } = req.body;
    const empresa_id = req.user.empresa_id;

    try {
        const novoProduto = await prisma.produtos.create({
            data: {
                nome,
                descricao: descricao || null,
+               marca: marca || null,
                preco_base,
                ativo: true,
                empresa_id,
                // ... resto do código ...
```

### 2. Na Edição (`atualizarProduto`):
No topo da função `atualizarProduto`, faça a mesma destruturação e adicione na query de `update`:
```diff
const atualizarProduto = async (req, res) => {
-   const { nome, descricao, preco_base, ativo, variacoes } = req.body;
+   const { nome, descricao, marca, preco_base, ativo, variacoes } = req.body;

    try {
        // ... verificações ...
        await prisma.$transaction(async (tx) => {
            await tx.produtos.update({
                where: { id: parseInt(req.params.id) },
                data: {
                    nome,
                    descricao,
+                   marca,
                    preco_base,
                    ativo
                }
            });
            // ... resto da transação ...
```

Pronto! Seguindo esses passos estruturados você terá a nova coluna adicionada com sucesso e operando de forma ideal em toda a sua API.
