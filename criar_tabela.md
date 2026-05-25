# Guia Passo a Passo: Criando a Tabela 'categorias' com Prisma

Este documento orienta você na criação de uma nova tabela (modelo) chamada `categorias` no banco de dados, utilizando o **Prisma ORM**, mantendo a compatibilidade e os relacionamentos de chaves estrangeiras com a tabela `empresas`.

---

## 📋 Estrutura da Tabela 'categorias'
A tabela será criada com as seguintes colunas solicitadas:
* `id`: Chave primária autoincrementável (`Int`).
* `empresa_id`: Chave estrangeira que se conecta à tabela `empresas`.
* `nome`: Nome da categoria (`String`).
* `produto_codigo`: Código associado ao produto (`String`).
* `createdAt`: Data/hora de criação do registro (`DateTime`).
* `updatedAt`: Data/hora de atualização do registro (`DateTime`).

---

## 🛠️ Passo 1: Atualizar o arquivo `schema.prisma`
Abra o arquivo `backend/prisma/schema.prisma` e siga os dois ajustes abaixo:

### A. Adicionar o Modelo `categorias`
Adicione o seguinte bloco no final do arquivo:

```prisma
model categorias {
  id             Int       @id @default(autoincrement())
  empresa_id     Int?
  nome           String    @db.VarChar(255)
  produto_codigo String?   @db.VarChar(255) // Veja a seção "Dica de Design" abaixo sobre este campo
  createdAt      DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt      DateTime  @default(now()) @db.Timestamptz(6)
  
  // Relacionamento com empresas: se a empresa for excluída, remove as categorias dela (Cascade)
  empresas       empresas? @relation(fields: [empresa_id], references: [id], onDelete: Cascade)
}
```

### B. Atualizar o Modelo `empresas`
Como estabelecemos uma relação entre `categorias` e `empresas`, o Prisma exige a relação inversa no modelo `empresas`. 

Localize o bloco `model empresas` no seu `schema.prisma` e adicione a linha indicada:

```prisma
model empresas {
  id            Int        @id @default(autoincrement())
  nome_fantasia String     @db.VarChar(255)
  // ... outras colunas ...
  clientes      clientes[]
  produtos      produtos[]
  usuarios      usuarios[]
  vendas        vendas[]
  categorias    categorias[] // 🟢 Adicione esta linha para completar o relacionamento!
}
```

---

## 🛠️ Passo 2: Sincronizar as alterações com o Banco de Dados
Com os modelos alterados no `schema.prisma`, execute o comando abaixo no terminal da sua pasta `backend` para criar fisicamente a tabela `categorias` no banco PostgreSQL:

```bash
npx prisma db push
```

### 💡 O que este comando faz?
1. Ele compara seu esquema do Prisma com o banco de dados.
2. Identifica que a tabela `categorias` não existe e a cria com as colunas, chaves estrangeiras, tipos de dados e fusos horários corretos.
3. Atualiza as relações e gera as chaves de integridade referencial.

---

## 🛠️ Passo 3: Regenerar o Prisma Client
Para disponibilizar a nova tabela no seu código JavaScript com autocompletar e tipagem nativa, rode o comando:

```bash
npx prisma generate
```

A partir desse momento, você já poderá efetuar requisições no seu backend usando:
```javascript
const novasCategorias = await prisma.categorias.findMany({
  where: { empresa_id: req.user.empresa_id }
});
```

---

## 💡 Dica Importante de Design: `produto_codigo`

Atualmente, modelamos o campo `produto_codigo` como uma coluna de texto simples (`String?`). No entanto, dependendo de como você deseja que as informações se comportem, você tem duas opções de estruturação:

### Opção A: Apenas Texto (Como configurado acima)
O campo `produto_codigo` armazena qualquer string de texto e não há validação no banco para garantir se o produto realmente existe. 
* **Vantagem:** Simples de implementar e flexível.
* **Desvantagem:** Pode haver erros de digitação e inconsistência de dados.

### Opção B: Relacionamento estrito com a tabela `produtos`
Se você quer que o banco impeça a criação de uma categoria apontando para um produto cujo código não exista:
1. Primeiro, no modelo `produtos` do seu `schema.prisma`, a coluna `codigo` precisaria ser única:
   ```prisma
   codigo String? @unique @db.VarChar(255)
   ```
2. No modelo `categorias`, mapearíamos a relação apontando para `produtos(codigo)`:
   ```prisma
   produto_codigo String?   @db.VarChar(255)
   produtos       produtos?  @relation(fields: [produto_codigo], references: [codigo], onDelete: SetNull)
   ```
   *(E no modelo `produtos`, você adicionaria a relação inversa: `categorias categorias[]`)*.

---

Seguindo estes passos, você criará a nova estrutura de tabelas de forma robusta e integrada no seu banco de dados utilizando as melhores práticas do Prisma!
