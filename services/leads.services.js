import { client } from "../index.js";
import { ObjectId } from "mongodb";

export const getAllLeads = async () => {
  return await client.db("crm").collection("leads").find({}).toArray();
};

export const createLeads = async (data) => {
  return await client.db("crm").collection("leads").insertMany(data);
};

export const updateLead = async (id, data) => {
  return await client
    .db("crm")
    .collection("leads")
    .updateOne({ _id: ObjectId(id) }, { $set: data });
};

export const userLeads = async (id) => {
  const user = await client
    .db("crm")
    .collection("users")
    .findOne({ _id: ObjectId(id) });
  const leadsData = await Promise.all(
    user.leads.map(async (el) => {
      return await client
        .db("crm")
        .collection("leads")
        .findOne({ _id: ObjectId(el) });
    })
  );

  return leadsData;
};
