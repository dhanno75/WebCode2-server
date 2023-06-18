import express from "express";
import {
  getAllLeads,
  createLeads,
  updateLead,
  userLeads,
  getLeadsPerMonth,
  deleteLead,
} from "../services/leads.services.js";
import { protect } from "../services/users.services.js";
import { ObjectId } from "mongodb";
import { client } from "../index.js";

const router = express.Router();

router.get("/", protect, getAllLeads);

router.get("/getLeadsPerMonth", protect, getLeadsPerMonth);

router.post("/", protect, createLeads);

router.put("/:id", protect, async (req, res) => {
  let id = req.params;
  const data = req.body;

  const result = await updateLead(id, data);

  res.send(result);
});

router.delete("/:id", protect, deleteLead);

router.get("/:userId", protect, userLeads);
export default router;
