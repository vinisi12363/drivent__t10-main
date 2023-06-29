import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import enrollmentsService from '@/services/enrollments-service';
import addressRepository from '@/repositories/address-repository';

export async function getEnrollmentByUser(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const enrollmentWithAddress = await enrollmentsService.getOneWithAddressByUserId(userId);

    return res.status(httpStatus.OK).send(enrollmentWithAddress);
  } catch (error) {
    return res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export async function postCreateOrUpdateEnrollment(req: AuthenticatedRequest, res: Response) {
  try {
    await enrollmentsService.createOrUpdateEnrollmentWithAddress({
      ...req.body,
      userId: req.userId,
    });

    return res.sendStatus(httpStatus.OK);
  } catch (error) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}


export async function getAddressFromCEP(req: AuthenticatedRequest, res: Response) {
  
  const {cep} = req.params ;
  if (cep.length !== 8){
    return res.status(httpStatus.BAD_REQUEST)
  }

  
    try {
      const address = await enrollmentsService.getAddressFromCEP(cep);
 
     
      if (address.bairro === undefined || address.cidade=== undefined || address.complemento === undefined|| address.logradouro === undefined || address.uf === undefined){
          return res.status(204).send("cep nao encontrado")

      }
      res.status(httpStatus.OK).send(address);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return res.send(httpStatus.NO_CONTENT);
      }
    }


 
}
