// Tipos da API FIPE baseados no openapi.json

export interface FipeBrand {
  code: string;
  name: string;
}

export interface FipeModel {
  code: string;
  name: string;
}

export interface FipeYear {
  code: string;
  name: string;
}

export interface FipeVehicleDetail {
  brand: string;
  codeFipe: string;
  fuel: string;
  fuelAcronym: string;
  model: string;
  modelYear: number;
  price: string;
  referenceMonth: string;
  vehicleType: number;
}

export type VehicleType = "cars" | "motorcycles" | "trucks";
