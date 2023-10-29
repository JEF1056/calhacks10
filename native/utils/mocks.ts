import moment from "moment";
import { v4 as uuid } from "uuid";

export const mockData = [
  {
    id: uuid(),
    name: "Lem",
    summary:
      "Lem's eyes appear clear and bright, which generally indicates good health. There's no sign of cloudiness or discharge.",
    picturePath: "Lem",
    ingested: [],
    lastSeen: moment(),
    dataHash: "string"
  },
  {
    id: uuid(),
    name: "Chonkers",
    summary:
      "Chonkers' fur looks soft and well-groomed. There are no visible patches of hair loss or skin irritations, suggesting good overall skin health.",
    picturePath: "Chonkers",
    ingested: [],
    lastSeen: moment(),
    dataHash: "string"
  },
  {
    id: uuid(),
    name: "Boba",
    summary:
      "Boba is lying down and appears relaxed in her outdoor environment, suggesting she feels secure and is not currently stressed or anxious.",
    picturePath: "Boba",
    ingested: [],
    lastSeen: moment(),
    dataHash: "string"
  },
  {
    id: uuid(),
    name: "Mochi",
    summary:
      "Mochi's overall appearance suggests she's enjoying an unhinged moment in the sun, which can be beneficial for her well-being.",
    picturePath: "Mochi",
    ingested: [],
    lastSeen: moment(),
    dataHash: "string"
  },
  {
    id: uuid(),
    name: "Anh",
    summary:
      "Anh seems relaxed and comfortable in her environment. She's neither hunched nor displaying signs of distress, suggesting she feels secure and is not experiencing discomfort.",
    picturePath: "Anh",
    ingested: [],
    lastSeen: moment(),
    dataHash: "string"
  }
];
