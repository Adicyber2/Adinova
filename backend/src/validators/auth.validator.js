import { body ,validationResult} from 'express-validator';



export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}


export const registerValidator = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  
    body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
  .notEmpty().withMessage("Pasword is required")
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];




export const loginValidator = [

  
    body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
  .notEmpty().withMessage("Pasword is required")

];


