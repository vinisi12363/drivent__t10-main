import { Address, Enrollment } from '@prisma/client';
import { request } from '@/utils/request';
import  httpStatus  from 'http-status';
import { invalidDataError, notFoundError, requestError } from '@/errors';
import addressRepository, { CreateAddressParams } from '@/repositories/address-repository';
import enrollmentRepository, { CreateEnrollmentParams } from '@/repositories/enrollment-repository';
import { exclude } from '@/utils/prisma-utils';

async function getAddressFromCEP(cep: string) {
 

  const result = await request.get(`${process.env.VIA_CEP_API}/${cep}/json/`)

  if (!result.data || result.data.erro) {
    throw notFoundError();
  }

  
  return {
            logradouro: result.data.logradouro,
            complemento:result.data.complemento,
            bairro: result.data.bairro,
            cidade: result.data.localidade,
            uf: result.data.uf 
          }
}

async function getOneWithAddressByUserId(userId: number): Promise<GetOneWithAddressByUserIdResult> {
  const enrollmentWithAddress = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollmentWithAddress) throw notFoundError();

  const [firstAddress] = enrollmentWithAddress.Address;
  const address = getFirstAddress(firstAddress);

  return {
    ...exclude(enrollmentWithAddress, 'userId', 'createdAt', 'updatedAt', 'Address'),
    ...(!!address && { address }),
  };
}

type GetOneWithAddressByUserIdResult = Omit<Enrollment, 'userId' | 'createdAt' | 'updatedAt'>;

function getFirstAddress(firstAddress: Address): GetAddressResult {
  const n:any = null;
  if (!firstAddress) return n;

  return exclude(firstAddress, 'createdAt', 'updatedAt', 'enrollmentId');
}

type GetAddressResult = Omit<Address, 'createdAt' | 'updatedAt' | 'enrollmentId'>;

async function createOrUpdateEnrollmentWithAddress(params: CreateOrUpdateEnrollmentWithAddress) {
  
  console.log('params', params)

 
  const address = getAddressForUpsert(params.address);

  



  const birthdayString = params.birthday.toString();
  const [year, month, day] = birthdayString.split('-');
  const birthdayFormatted = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(birthdayFormatted.getTime())) {
    console.log('invalid date');
    return;
  }
  let body = {
    name:params.name,
    cpf:params.cpf,
    birthday:birthdayFormatted,
    phone:params.phone,
    userId:params.userId,
    address:{
      cep:params.address.cep,
      street:params.address.street,
      city:params.address.city,
      number:params.address.number,
      state:params.address.state,
      neighborhood:params.address.neighborhood,
      addressDetail:params.address.addressDetail
    }
  } 
 
    const verifyCep = await getAddressFromCEP(params.address.cep)
    if (!verifyCep.cidade ||verifyCep.cidade === 'undefined') {
      throw notFoundError();
    }
    const enrollment = exclude(body, 'address');
    const newEnrollment = await enrollmentRepository.upsert(body.userId, enrollment, exclude(enrollment, 'userId'));

    console.log("newEnrollmenmt", newEnrollment)
    await addressRepository.upsert(newEnrollment.id, address, address);
  

}

function getAddressForUpsert(address: CreateAddressParams) {
  return {
    ...address,
    ...(address?.addressDetail && { addressDetail: address.addressDetail }),
  };
}

export type CreateOrUpdateEnrollmentWithAddress = CreateEnrollmentParams & {
  address: CreateAddressParams;
};

const enrollmentsService = {
  getOneWithAddressByUserId,
  createOrUpdateEnrollmentWithAddress,
  getAddressFromCEP,
};

export default enrollmentsService;
