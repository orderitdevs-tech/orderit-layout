"use client";
import RestaurantLayoutBuilder from "@/components/RestaurantLayoutBuilder";
import { useParams } from "next/navigation";

export default function Home() {
    const params = useParams()
    const restaurantId = params?.restaurantId as string
    return <RestaurantLayoutBuilder restaurantId={restaurantId}/>;
}
