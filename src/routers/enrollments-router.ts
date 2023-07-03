import { Router } from 'express';
import { authenticateToken, validateBody, validateQuery } from '@/middlewares';
import  {cepValidation} from '@/schemas/enrollments-schemas'
import { getEnrollmentByUser, postCreateOrUpdateEnrollment, getAddressFromCEP } from '@/controllers';
import { createOrUpdateEnrollmentSchema } from '@/schemas';

const enrollmentsRouter = Router();

enrollmentsRouter
  .get('/cep', validateQuery(cepValidation), getAddressFromCEP)
  .all('/*', authenticateToken)
  .get('/', getEnrollmentByUser)
  .post('/', validateBody(createOrUpdateEnrollmentSchema), postCreateOrUpdateEnrollment);

export { enrollmentsRouter };
