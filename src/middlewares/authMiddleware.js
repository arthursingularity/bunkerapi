const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Pega o token do cabeçalho da requisição (ex: "Bearer eyJhbGciOi...")
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
    }

    const token = authHeader.split(' ')[1]; // Separa a palavra "Bearer" do token em si

    try {
        // Verifica se o token é válido e foi assinado pela sua API
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo_padrao');
        
        // Coloca os dados decodificados (id, cargo, empresa_id) dentro do req.user
        req.user = decoded; 
        
        // Passa a bola para frente (ex: vai para o produtoController)
        next(); 
    } catch (error) {
        return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
};

module.exports = authMiddleware;