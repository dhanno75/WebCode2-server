import { client } from "../index.js";
import { ObjectId } from "mongodb";
import { leadCreationEmail } from "../utils/email.js";

export const getAllLeads = async (req, res) => {
  const currentUser = req.user;
  let leads;
  if (currentUser.role === "admin" || currentUser.role === "manager") {
    leads = await client.db("crm").collection("leads").find({}).toArray();
  } else {
    leads = await client
      .db("crm")
      .collection("leads")
      .find({ createdByUser: ObjectId(req.user._id) })
      .toArray();
  }

  res.status(200).json({
    status: "success",
    length: leads.length,
    data: leads,
  });
};

export const getLeadsPerMonth = async (req, res) => {
  const currentUser = req.user;
  let leads;
  if (currentUser.role === "admin" || currentUser.role === "manager") {
    leads = await client
      .db("crm")
      .collection("leads")
      .aggregate([
        {
          $group: {
            _id: {
              $month: "$createdAt",
            },
            leadsAddMonth: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .toArray();
  } else {
    leads = await client
      .db("crm")
      .collection("leads")
      .aggregate([
        {
          $match: {
            createdByUser: ObjectId(currentUser._id),
          },
        },
        {
          $group: {
            _id: {
              $month: "$createdAt",
            },
            leadsAddMonth: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .toArray();
  }

  res.status(200).json({
    status: "success",
    data: leads,
  });
};

export const createLeads = async (req, res) => {
  const data = req.body;
  const lead = await client
    .db("crm")
    .collection("leads")
    .insertOne({
      ...data,
      createdAt: new Date(Date.now()),
      createdByUser: req.user._id,
    });

  const manager = await client
    .db("crm")
    .collection("users")
    .findOne({ _id: ObjectId(req.user.manager) });

  const resetUrl = `${req.protocol}://localhost:3000/resetPassword`;

  const message = `
  Greetings,

  A new lead has been created by the employee ${req.user.name}. These are the details of the lead:- 
  Name: ${data.leadname}
  Company: ${data.company}
  Email: ${data.email}

  Thanks & regards,
  CRM team
  `;

  try {
    await leadCreationEmail({
      emails: ["p-dhananjay@outlook.com", manager.email],
      subject: "New lead creation",
      message,
    });

    res.status(200).send({
      status: "success",
      message: "User signed up successfully",
    });
    return lead;
  } catch (err) {
    return res.status(500).send({
      status: "fail",
      message: "There was an error sending an email. Try again later.",
    });
  }
};

export const updateLead = async (id, data) => {
  return await client
    .db("crm")
    .collection("leads")
    .updateOne({ _id: ObjectId(id) }, { $set: data });
};

export const userLeads = async (req, res) => {
  let { userId } = req.params;
  const user = await client
    .db("crm")
    .collection("users")
    .findOne({ _id: ObjectId(userId) });
  // const leadsData = await Promise.all(
  //   user.leads.map(async (el) => {
  //     return await client
  //       .db("crm")
  //       .collection("leads")
  //       .findOne({ _id: ObjectId(el) });
  //   })
  // );

  const leadsData = await client
    .db("crm")
    .collection("leads")
    .find({ createdByUser: ObjectId(user._id) })
    .toArray();

  res.status(200).json({
    status: "success",
    data: leadsData,
  });
};

export const deleteLead = async (req, res) => {
  let uid = req.user._id;
  let { id } = req.params;
  const leadExistInUser = client
    .db("crm")
    .collection("leads")
    .findOne({ _id: ObjectId(id) });

  if (leadExistInUser) {
    await client
      .db("crm")
      .collection("leads")
      .deleteOne({ _id: ObjectId(id) });
  } else {
    res.status(401).json({
      status: "fail",
      message: "There is no lead with this ID.",
    });
  }
  res.status(204).json({
    message: "success",
  });
};
