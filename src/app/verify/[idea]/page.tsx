import { createClient } from '@supabase/supabase-js'

type Props = {
  params: {
    ideaId: string
  }
}

export default async function VerifyPage({ params }: Props) {

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const code = params.ideaId

/* ================= FETCH IDEA ================= */


const { data: idea } = await supabase
  .from('ideas')
  .select('*')
  .eq('verification_code', code)
  .maybeSingle()

/* ================= NOT FOUND ================= */

if (!idea) {

return (

<div style={{
minHeight:'100vh',
display:'flex',
alignItems:'center',
justifyContent:'center',
background:'#020617',
color:'#fff',
fontFamily:'sans-serif'
}}>

<div style={{
background:'#111827',
padding:40,
borderRadius:12,
textAlign:'center'
}}>

<h1 style={{fontSize:28}}>❌ Certificate Not Found</h1>

<p style={{marginTop:10}}>
This certificate does not exist in the Bank of Unique Ideas registry.
</p>

</div>

</div>

);

}

/* ================= VERIFIED PAGE ================= */

return (

<div style={{
minHeight:'100vh',
display:'flex',
alignItems:'center',
justifyContent:'center',
background:'#020617',
color:'#fff',
fontFamily:'sans-serif'
}}>

<div style={{
background:'#111827',
padding:40,
borderRadius:12,
maxWidth:600,
width:'100%'
}}>

<h1 style={{
fontSize:30,
marginBottom:10,
textAlign:'center'
}}>
BANK OF UNIQUE IDEAS
</h1>

<h2 style={{
textAlign:'center',
color:'#22c55e',
marginBottom:25
}}>
✔ VERIFIED IDEA DEPOSIT
</h2>

<div style={{lineHeight:1.9}}>

<p>
<strong>Certificate Number:</strong><br/>
GLOBUI-{idea.id.slice(0,8).toUpperCase()}
</p>

<p>
<strong>Inventor:</strong><br/>
{idea.full_name || "Unknown"}
</p>

<p>
<strong>Idea Title:</strong><br/>
{idea.title}
</p>

<p>
<strong>Submission Date:</strong><br/>
{new Date(idea.created_at).toLocaleString()}
</p>

<p>
<strong>Verification Code:</strong><br/>
{idea.verification_code}
</p>

<p>
<strong>Idea Hash (SHA-256):</strong><br/>
<span style={{
fontSize:12,
wordBreak:'break-all'
}}>
{idea.idea_hash || "Pending"}
</span>
</p>

</div>

<hr style={{
marginTop:25,
marginBottom:15,
borderColor:'#333'
}}/>

<p style={{
fontSize:13,
textAlign:'center',
color:'#9ca3af'
}}>
This record confirms that the above idea was deposited in the
Bank of Unique Ideas registry.
</p>

</div>

</div>

);

}