import { Router } from "express";
import { getShows, getMovies } from "../controllers/catalog.controller";

const router = Router();

router.get("/shows", getShows);
router.get("/movies", getMovies);

export default router;
