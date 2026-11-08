import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_runway_vector_key';

export const verifyToken = (req, res, next) => {
  // Grab token from the incoming header matrix
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expects: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: Missing cryptographic identity token.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Append verified profile payload parameters to the request vector
    next(); // Step cleanly into the controller route
  } catch (err) {
    res.status(403).json({ error: 'Access Denied: Token signature is altered or expired.' });
  }
};