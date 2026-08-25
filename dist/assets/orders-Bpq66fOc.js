import"./modulepreload-polyfill-B5Qt9EMX.js";import{e as o}from"./data-DxFdvImm.js";localStorage.getItem("alsheeri_user")||(window.location.href="/login.html");function d(){const n=o().reverse(),a=document.getElementById("no-orders"),l=document.getElementById("orders-list");if(n.length===0){a.classList.remove("hidden");return}a.classList.add("hidden"),l.innerHTML="";const r={Placed:"bg-yellow-100 text-yellow-800",Preparing:"bg-blue-100 text-blue-800","Out for Delivery":"bg-purple-100 text-purple-800",Delivered:"bg-green-100 text-green-800",Cancelled:"bg-red-100 text-red-800"};n.forEach(e=>{const i=new Date(e.time),s=document.createElement("div");s.className="bg-white rounded-xl border p-4",s.innerHTML=`
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="font-bold text-sm">${e.id}</p>
                <p class="text-xs text-gray-500">${i.toLocaleDateString("en-IN")} at ${i.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</p>
              </div>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${r[e.status]||"bg-gray-100 text-gray-800"}">${e.status}</span>
            </div>
            <div class="divide-y">
              ${e.items.map(t=>`
                <div class="py-2 flex justify-between text-sm">
                  <span>${t.name} x ${t.qty}</span>
                  <span class="text-gray-600">₹${t.price*t.qty}</span>
                </div>
              `).join("")}
            </div>
            <div class="flex justify-between mt-3 pt-3 border-t font-bold text-sm">
              <span>Total</span>
              <span>₹${e.total+30}</span>
            </div>
          `,l.appendChild(s)})}d();setInterval(d,5e3);
