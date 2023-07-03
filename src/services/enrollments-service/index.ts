import { Address, Enrollment } from '@prisma/client';
import { request } from '@/utils/request';
import  httpStatus  from 'http-status';
import { invalidDataError, notFoundError, requestError } from '@/errors';
import addressRepository, { CreateAddressParams } from '@/repositories/address-repository';
import enrollmentRepository, { CreateEnrollmentParams } from '@/repositories/enrollment-repository';
import { exclude } from '@/utils/prisma-utils';
import { ViaCEPAddress } from '@/protocols';


type AddressObject = {
  logradouro: string ,
  complemento:string | null,
  bairro:string,
  cidade:string ,
  uf:string
}

async function getAddressFromCEP(cep: string) {
  const result = await request.get(`${process.env.VIA_CEP_API}/${cep}/json/`);

  if (!result?.data || result?.data?.erro) {
    throw notFoundError();
  }

  const address:AddressObject= { 
    logradouro:result.data.logradouro,
    complemento:result.data.complemento,
    bairro:result.data.bairro,
    cidade:result.data.logradouro,
    uf:result.data.uf
   };
  return address;
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

/*   ta lindo mas n ta passando no teste....
async function createOrUpdateEnrollmentWithAddress(params: CreateOrUpdateEnrollmentWithAddress) {
  const enrollment = exclude(params, 'address');
  const address = getAddressForUpsert(params.address);

  let formattedCEP = params.address.cep.replace(/-/g, "");
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
      cep:formattedCEP,
      street:params.address.street,
      city:params.address.city,
      number:params.address.number,
      state:params.address.state,
      neighborhood:params.address.neighborhood,
      addressDetail:params.address.addressDetail
    }
  } 
  

   await getAddressFromCEP(address.cep)
    
    const newEnrollment = await enrollmentRepository.upsert(params.userId, enrollment, exclude(enrollment, 'userId'));

    console.log("newEnrollmenmt", newEnrollment)
    await addressRepository.upsert(newEnrollment.id, address, address);
  

} */

async function createOrUpdateEnrollmentWithAddress(params: CreateOrUpdateEnrollmentWithAddress) {
  const enrollment = exclude(params, 'address');
  const address = getAddressForUpsert(params.address);

  await getAddressFromCEP(params.address.cep);

  const newEnrollment = await enrollmentRepository.upsert(params.userId, enrollment, exclude(enrollment, 'userId'));

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
