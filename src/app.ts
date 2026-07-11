import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { authRoutes } from "./modules/auth/auth.route";
import { CategoryRoutes } from "./modules/category/category.route";
import { PropertyRoutes } from "./modules/property/property.route";
import { RentalRoutes } from "./modules/rental/rental.route";
import { LandlordRoutes } from "./modules/landlord/landlord.route";
import { PaymentRoutes } from "./modules/payment/payment.route";




const app : Application = express();

app.use(cors({
    origin : config.app_url,
    credentials : true,
}))


app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());


app.get("/",(req : Request, res : Response) => {
    res.send("Hello, World!");
});


// app.use("/api/users", userRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/categories", CategoryRoutes)
app.use("/api/properties", PropertyRoutes)
app.use("/api/rentals", RentalRoutes)
app.use("/api/landlord", LandlordRoutes)
app.use("/api/payments", PaymentRoutes)


app.use(notFound)

app.use(globalErrorHandler)

export default app;