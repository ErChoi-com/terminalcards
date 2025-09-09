import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const serverside = express();
const PORT = 3000;
const GITAPI = process.env.GITAPI;