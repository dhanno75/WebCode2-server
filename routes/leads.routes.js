import express from "express";
import {
  getAllLeads,
  createLeads,
  updateLead,
  userLeads,
} from "../services/leads.services.js";
import { protect } from "../services/users.services.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const leads = await getAllLeads();
  res.status(200).json({ leads });
});

router.post("/", protect, async (req, res) => {
  const data = req.body;
  console.log(req.user);
  const leads = await createLeads(data, req);
  res.status(200).json({ leads });
});

router.put("/:id", async (req, res) => {
  let id = req.params;
  const data = req.body;

  const result = await updateLead(id, data);

  res.send(result);
});

export default router;

router.get("/:userId", async (req, res) => {
  let { userId } = req.params;

  const result = await userLeads(userId);
  res.status(200).json({
    status: "success",
    data: result,
  });
});
