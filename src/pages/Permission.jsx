import { useNavigate } from "react-router-dom";

export default function Permission(){

const navigate = useNavigate();

const allowLocation = () => {

navigator.geolocation.getCurrentPosition(()=>{

navigate("/login/user")

})

}

return(

<div className="h-screen flex flex-col items-center justify-center">

<h1 className="text-3xl font-bold mb-4">
Allow Location
</h1>

<p className="text-gray-600 mb-6">
We need your location to find drivers
</p>

<button
onClick={allowLocation}
className="bg-green-600 text-white px-8 py-3 rounded-xl"
>

Allow Location

</button>

</div>

)

}