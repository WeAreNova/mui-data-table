import faker from "faker";
import { Fragment } from "react";
import { ColumnDefinition, OnChangeObject } from "./lib";

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
  dob: Date;
  contactNumber: string;
  addressHistory: Address[];
}

const USER_ROLES = ["publicUser", "readOnlyUser", "user", "readOnlyAdmin", "admin"] as const;

export type UserRole = typeof USER_ROLES[number];

export interface User {
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
    key: "fullName",
    title: "Full Name",
    render: (record) => `${record.forenames} ${record.surname}`,
    sorter: true,
    filterColumn: true,
    pinnable: true,
  },
  {
    key: "email",
    title: "Email",
    dataIndex: "email",
    sorter: true,
    filterColumn: true,
    pinnable: true,
  },
  {
    key: "contactNumber",
    groupBy: "email",
    title: "Contact Number",
    dataIndex: "personalDetails.contactNumber",
    sorter: true,
    filterColumn: true,
    pinnable: true,
  },
  {
    key: "address",
    groupBy: "email",
    title: "Address",
    render: (record, isCSVExport) => {
      return record.personalDetails
        ? isCSVExport
          ? record.personalDetails.addressHistory
              .map(({ addressLineOne, addressLineTwo, city, country, postcode }) => {
                const lineTwo = addressLineTwo ? ` ${addressLineTwo}` : "";
                return `${addressLineOne} ${lineTwo} ${city} ${country} ${postcode}`;
              })
              .join("\n")
          : record.personalDetails.addressHistory.map(
              ({ addressLineOne, addressLineTwo, city, country, postcode }, oIndex) => (
                <Fragment key={oIndex}>
                  {oIndex > 0 && <hr />}
                  <address>
                    {[addressLineOne, addressLineTwo, city, country, postcode].filter(Boolean).map((line, iIndex) => (
                      <Fragment key={iIndex}>
                        {line}
                        <br />
                      </Fragment>
                    ))}
                  </address>
                </Fragment>
              ),
            )
        : null;
    },
    sorter: "personalDetails.addressHistory.addressLineOne",
    filterColumn: "personalDetails.addressHistory.addressLineOne",
  },
  {
    key: "role",
    groupBy: "email",
    title: "Role",
    dataIndex: "role",
    sorter: true,
    filterColumn: true,
  },
  {
    key: "registrationDate",
    groupBy: "email",
    title: "Registration Date",
    dataIndex: "registrationDateFormatted",
    sorter: "registrationDate",
    filterColumn: { path: "registrationDate", type: "date" },
    pinnable: true,
  },
  {
    key: "balances",
    groupBy: "email",
    title: "Cash Balance",
    colGroup: [
      {
        key: "balances.total",
        groupBy: "email",
        title: "Total",
        dataIndex: "balances.total",
        sorter: true,
        numerical: {
          path: true,
          decimalPlaces: 2,
        },
        filterColumn: { path: true, type: "number" },
      },
      {
        key: "balances.invested",
        groupBy: "email",
        title: "Invested",
        dataIndex: "balances.invested",
        sorter: true,
        numerical: {
          path: true,
          decimalPlaces: 2,
        },
        filterColumn: { path: true, type: "number" },
      },
      {
        key: "balances.available",
        groupBy: "email",
        title: "Available",
        dataIndex: "balances.available",
        sorter: true,
        numerical: {
          path: true,
          decimalPlaces: 2,
        },
        filterColumn: { path: true, type: "number" },
      },
    ],
  },
  {
    key: "emailConfirmed",
    groupBy: "email",
    title: "Email Confirmed",
    dataIndex: "isConfirmed",
    sorter: true,
    filterColumn: { path: true, type: "boolean" },
    render: (record) => (typeof record.isConfirmed === "undefined" ? null : String(record.isConfirmed)),
  },
];

const data = (() => {
  return faker.datatype.array(faker.datatype.number({ min: 10, max: 100 })).flatMap<User>(() => {
    const totalBalance = faker.datatype.number({ min: 0, max: 10_000_000 });
    const investedBalance = faker.datatype.number({ min: 0, max: totalBalance });
    const value = {
      email: faker.internet.email(),
      title: faker.name.prefix(),
      forenames: faker.name.firstName(),
      surname: faker.name.lastName(),
      password: faker.internet.password(),
      isConfirmed: faker.datatype.boolean(),
      registrationDate: faker.date.past(),
      role: faker.random.arrayElement(USER_ROLES),
      personalDetails: !faker.datatype.boolean()
        ? undefined
        : {
            dob: faker.date.past(),
            contactNumber: faker.phone.phoneNumber(),
            addressHistory: new Array(faker.datatype.number({ min: 1, max: 5 })).map<Address>(() => ({
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
    return [value, value];
  });
})();

export const getData = async (options?: OnChangeObject) =>
  new Promise<User[]>((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 1000);
  });
