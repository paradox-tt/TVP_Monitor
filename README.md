# Thousand Validator - Nomination Monitoring Tool
A bot that monitors nominations of the accounts held by the 1KV programme.

<b>Rationale</b>
<br/>
<p>At times members of the Thousand Validator Programme (TVP) query the status of the nomination system when they have not been nominated for a long period of time. 
This system allows users to examine the nomination history of the TVP nomination accounts to ascertain if the system is rotating nominations.  It further allows users to anticipate when nominations are incoming so that that they may plan accordingly.
</p>

 
 <b>Public channels</b>
 <ul>
  <li>#kusama-tvp-monitor:matrix.org</li>
  <li>#polkadot-tvp-monitor:matrix.org</li>
 </ul>
 
 <b>TVP Nomination System</b>
 <p>The Thousand validator programme is governed by an automated system commonly referred to as the 1KV_backend.  This system monitors metrics for each candidate and 
    uses a weighted system to elect nominees every 24hrs.
</p>
<p>
  The 1kv_backend nominates canidates using a delayed proxy system.  When it selects nominees for each account, those nominations would be applied in 18hrs.  On Polkadot the nomination arrives in session five (5) of the era and this is too late for the candidate to be considered for active validation in the next era.  These candidates have an opporunity to validate in the era subsequent to the next.
  </p>
  <p>
  Most of the queries related to issues with the nomination system lay with candidates themselves but there have been occassions due to major events when the system did not operate properly.  A few examples would be:
  <ul>
    <li> Maximum number of nominator accounts attained on Polkadot </li>
    <li> Metadata v14 </li>
    <li> Errors due to blocked nominations </li>
    <li> Failed proxy events </li>
    </ul>
       
  </p>
 
 <b>Functionality</b>
 
<p>
  The system provides notifications on three events:
</p>
<ol>
  <li>When nominees are decided and the proxy is triggered.  The bot will retrieve the last proxied nominees and using strikethrough messages represent a change in validators</li>
  <li>~18hrs after the proxied call is issued the bot alerts that the nominees should change in the next era</li>
  <li> At each era change, the bot monitors for any changes in nominations.  If there are differences this is represented with strikethroughs, any validator to retain nominations for a subsequent era would have their era count incremented.</li>
</ol>
 
 TO BE COMPLETED
