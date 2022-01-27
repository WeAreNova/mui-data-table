import { FormHelperText, TextField } from "@material-ui/core";
import { ColumnDefinition, EditComponentProps } from "@wearenova/mui-data-table";
import faker from "faker";
import React, { Fragment } from "react";
import * as Yup from "yup";

interface Address {
  addressLineOne: string;
  addressLineTwo?: string;
  city: string;
  country: string;
  postcode: string;
  lengthYears: number;
  lengthMonths: number;
}

interface PersonalDetails {
  dob?: Date;
  contactNumber?: string;
  addressHistory?: Address[];
}

const USER_ROLES = ["publicUser", "readOnlyUser", "user", "readOnlyAdmin", "admin"] as const;

export type UserRole = typeof USER_ROLES[number];

export interface User {
  id: string;
  email: string;
  title?: string;
  forenames: string;
  surname: string;
  password?: string;
  isConfirmed: boolean;
  registrationDate: string | Date;
  role: UserRole;
  personalDetails?: PersonalDetails;
  balances: {
    total: number;
    invested: number;
    available: number;
  };
}

export const STRUCTURE: ColumnDefinition<User>[] = [
  {
    key: "id",
    dataIndex: "id",
    title: "ID",
    hidden: true,
    filterColumn: true,
  },
  {
    key: "fullName",
    title: "Full Name",
    dataIndex: "forenames",
    render: (record) => `${record.forenames} ${record.surname}`,
    sorter: true,
    filterColumn: true,
    pinnable: true,
  },
  {
    key: "email",
    title: "Email",
    dataIndex: "email",
    groupBy: "email",
    editable: true,
    sorter: true,
    filterColumn: true,
    pinnable: true,
  },
  {
    key: "contactNumber",
    title: "Contact Number",
    dataIndex: "personalDetails.contactNumber",
    editable: true,
    sorter: true,
    filterColumn: true,
    pinnable: true,
  },
  {
    key: "address",
    title: "Address",
    sorter: "personalDetails.addressHistory.addressLineOne",
    filterColumn: "personalDetails.addressHistory.addressLineOne",
    editable: {
      path: "personalDetails.addressHistory",
      validate: (value) =>
        Yup.array(
          Yup.object({
            addressLineOne: Yup.string().required("Address line one is required"),
            addressLineTwo: Yup.string(),
            city: Yup.string().required("City is required"),
            country: Yup.string().required("Country is required"),
            postcode: Yup.string().required("Postcode is required"),
          }),
        ).validate(value),
      component: ({ defaultValue, onChange, disabled, helperText }: EditComponentProps<Address[]>) =>
        defaultValue.map((value, index) => {
          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange((v) => {
              const newValue = [...v];
              newValue[index] = { ...newValue[index], [e.target.name]: e.target.value };
              return newValue;
            });
          return (
            <Fragment key={index}>
              {Boolean(index) && <hr />}
              <TextField
                name="addressLineOne"
                defaultValue={value.addressLineOne}
                onChange={handleChange}
                placeholder="Line One"
                disabled={disabled}
              />
              <TextField
                name="addressLineTwo"
                defaultValue={value.addressLineTwo}
                onChange={handleChange}
                placeholder="Line Two"
                disabled={disabled}
              />
              <TextField
                name="city"
                defaultValue={value.city}
                onChange={handleChange}
                placeholder="City"
                disabled={disabled}
              />
              <TextField
                name="country"
                defaultValue={value.country}
                onChange={handleChange}
                placeholder="Country"
                disabled={disabled}
              />
              <TextField
                name="postcode"
                defaultValue={value.postcode}
                onChange={handleChange}
                placeholder="Postcode"
                disabled={disabled}
              />
              <FormHelperText error>{helperText}</FormHelperText>
            </Fragment>
          );
        }),
      defaultValue: [
        {
          addressLineOne: "",
          addressLineTwo: "",
          city: "",
          country: "",
          postcode: "",
        },
      ],
    },
    render: (record, isCSVExport) => {
      if (!record.personalDetails?.addressHistory) return null;
      if (isCSVExport)
        record.personalDetails.addressHistory
          .map(({ addressLineOne, addressLineTwo, city, country, postcode }) => {
            const lineTwo = addressLineTwo ? ` ${addressLineTwo}` : "";
            return `${addressLineOne} ${lineTwo} ${city} ${country} ${postcode}`;
          })
          .join("\n");
      return record.personalDetails.addressHistory.map(
        ({ addressLineOne, addressLineTwo, city, country, postcode }, addressIndex) => {
          const addressArr = [addressLineOne, addressLineTwo, city, country, postcode];
          return (
            <Fragment key={addressArr.join()}>
              {addressIndex > 0 && <hr />}
              <address>
                {addressArr.filter(Boolean).map((line, addressLineIndex) => (
                  <Fragment key={addressLineIndex}>
                    {line?.split(" ").map((word, wordIndex) => (
                      <Fragment key={wordIndex}>{word}&nbsp;</Fragment>
                    ))}
                    <br />
                  </Fragment>
                ))}
              </address>
            </Fragment>
          );
        },
      );
    },
  },
  {
    key: "role",
    title: "Role",
    dataIndex: "role",
    editable: true,
    sorter: true,
    filterColumn: true,
  },
  {
    key: "registrationDate",
    dataType: "date",
    title: "Registration Date",
    dataIndex: "registrationDate",
    render: (record) => new Date(record.registrationDate).toLocaleDateString(),
    sorter: true,
    filterColumn: true,
    editable: {
      path: true,
      validate: (value) => Yup.date().typeError("Date invalid").required("Required value").validate(value),
    },
    pinnable: true,
  },
  {
    key: "balances",
    title: "Cash Balance",
    pinnable: true,
    colGroup: [
      {
        key: "balances.total",
        dataType: "number",
        title: "Total",
        dataIndex: "balances.total",
        sorter: true,
        numerical: { path: true, decimalPlaces: 2 },
        filterColumn: true,
        editable: true,
      },
      {
        key: "balances.invested",
        dataType: "number",
        title: "Invested",
        dataIndex: "balances.invested",
        sorter: true,
        numerical: { path: true, decimalPlaces: 2 },
        filterColumn: true,
        editable: true,
      },
      {
        key: "balances.available",
        dataType: "number",
        title: "Available",
        dataIndex: "balances.available",
        sorter: true,
        numerical: { path: true, decimalPlaces: 2 },
        filterColumn: true,
        editable: true,
      },
    ],
  },
  {
    key: "emailConfirmed",
    dataType: "boolean",
    title: "Email Confirmed",
    dataIndex: "isConfirmed",
    sorter: true,
    filterColumn: true,
    editable: true,
  },
];

const data = (() => {
  return faker.datatype.array(faker.datatype.number({ min: 10, max: 100 })).flatMap<User>(() => {
    const totalBalance = faker.datatype.number({ min: 0, max: 10_000_000 });
    const investedBalance = faker.datatype.number({ min: 0, max: totalBalance });
    const registrationDate = faker.date.past();
    const value = {
      id: faker.datatype.uuid(),
      email: faker.internet.email(),
      title: faker.name.prefix(),
      forenames: faker.name.firstName(),
      surname: faker.name.lastName(),
      password: faker.internet.password(),
      isConfirmed: faker.datatype.boolean(),
      registrationDate,
      registrationDateFormatted: registrationDate.toLocaleDateString(),
      role: faker.random.arrayElement(USER_ROLES),
      personalDetails: !faker.datatype.boolean()
        ? undefined
        : {
            dob: faker.date.past(),
            contactNumber: faker.phone.phoneNumber(),
            addressHistory: faker.datatype.array(faker.datatype.number({ min: 1, max: 3 })).map<Address>(() => ({
              addressLineOne: faker.address.streetAddress(),
              addressLineTwo: faker.address.secondaryAddress(),
              city: faker.address.city(),
              country: faker.address.country(),
              postcode: faker.address.zipCode(),
              lengthYears: faker.datatype.number({ min: 1, max: 10 }),
              lengthMonths: faker.datatype.number({ min: 1, max: 12 }),
            })),
          },
      balances: {
        total: totalBalance,
        invested: investedBalance,
        available: totalBalance - investedBalance,
      },
    };
    return [value, { ...value, id: faker.datatype.uuid() }, { ...value, id: faker.datatype.uuid() }];
  });
})();

export const getData = async () =>
  new Promise<User[]>((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 1000);
  });
