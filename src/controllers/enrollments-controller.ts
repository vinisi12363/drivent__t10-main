import { Response, query } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import enrollmentsService from '@/services/enrollments-service';
import addressRepository from '@/repositories/address-repository';
import { string } from 'joi';

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

  //const cep: string = req.query.cep ? req.query.cep.toString() : '';
  const cep = req.query.cep as string

    try {
      const address = await enrollmentsService.getAddressFromCEP(cep);
      console.log("address", address)
      res.status(httpStatus.OK).send(address);
    } catch (error:any) {
      if (error.name === 'NotFoundError') {
        return res.status(httpStatus.NO_CONTENT).send(httpStatus.NO_CONTENT);
      }
      return res.status(500).send(error);
    }


 
}
