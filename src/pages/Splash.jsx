import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash(){

const navigate = useNavigate();

useEffect(()=>{

setTimeout(()=>{
navigate("/permission")
},2000)

},[])

return(

<div className="h-screen flex items-center justify-center bg-green-600 text-white">

<div className="text-center animate-pulse">

<h1 className="text-5xl font-bold">
DesiRides
</h1>

<p className="mt-2">
Village Ride Partner
</p>

</div>

</div>

)

}