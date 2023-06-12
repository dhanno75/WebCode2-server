import express from "express";
import {
  getAllLeads,
  createLeads,
  updateLead,
  userLeads,
} from "../services/leads.services.js";
import { protect } from "../services/users.services.js";
import { ObjectId } from "mongodb";
import { client } from "../index.js";

const router = express.Router();

router.get("/", async (req, res) => {
  let leads = await getAllLeads();
  res
    .status(200)
    .json({ status: "success", length: leads.length, data: leads });
});

router.post("/", protect, createLeads);

router.put("/:id", async (req, res) => {
  let id = req.params;
  const data = req.body;

  const result = await updateLead(id, data);

  res.send(result);
});

router.delete("/:id", protect, async (req, res) => {
  let uid = req.user._id;
  let { id } = req.params;
  const leadExistInUser = req.user.leads.find((el) => el.equals(id));

  if (leadExistInUser) {
    await client
      .db("crm")
      .collection("leads")
      .deleteOne({ _id: ObjectId(id) });

    await client
      .db("crm")
      .collection("users")
      .updateOne(
        { _id: ObjectId(uid) },
        { $pull: { leads: { _id: ObjectId(id) } } }
      );
  } else {
    res.status(401).json({
      status: "fail",
      message: "There is no lead with this ID.",
    });
  }
  res.status(204).json({
    message: "success",
  });
});

router.get("/:userId", async (req, res) => {
  let { userId } = req.params;

  const result = await userLeads(userId);
  res.status(200).json({
    status: "success",
    data: result,
  });
});
export default router;
