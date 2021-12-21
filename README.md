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
 <hr/>
 <b>Phase 2</b>
 <br/>
<p>With the launch of the application in private quarters some suggestions for improvments have been noted.  These items will be actioned as a phase 2 after a public launch of the initial build.
<ul>
 <li>Allow users to opt in for ping notifications (matrix address taken from an identity)</li>
 <li>Develop independent timers for Proxy events, if a Proxy event isn't received within the expected time then produce an error for investigation</li>
 </ul>
</p>
<hr/>

<b>Images<b>
<br/> 
<figure> 
<img src='https://github.com/paradox-tt/TVP_Monitor/blob/main/images/ProxyNominationChange.jpg'>
<figcaption align="center">Img 1: Shows a change in nomination at the proxy level, this SHOULD be applied in the future and gives the validator some forewarning</figcaption>
 </figure>
<br/> <br/> 
<figure> 
<img src='https://github.com/paradox-tt/TVP_Monitor/blob/main/images/ChangeInNominations.jpg'>
<figcaption align="center">Img 2: Shows a change in actual nomination, this confirms that the proxy call was actually made</figcaption>
 </figure>
<hr/>
<b>Promotion</b>

<p>If you like this tool and would like to lend support to the developer kindly consider nominating my validator nodes

<b>Polkadot</b>
  <ul><li>PARANODES.IO/01 - 14hM4oLJCK6wtS7gNfwTDhthRjy5QJ1t3NAcoPjEepo9AH67</li></ul>

 <b>Kusama</b> 
 <ul>
    <li>PARANODES.IO/01 - H3DL157HL7DkvV2kXocanmKaGXNyQphUDVW33Fnfk8KNhsv</li>
    <li>PARANODES.IO/02 - HtYny8Eker9VBEKQrtBd6Y5PTkaHQFSvyMFy2bkd66wGBan</li>
    <li>PARANODES.IO/03 - FkWky3r2bryP3aaAwVWykYrKesAwkDyKZWsDyBvck7YawSi</li>
    <li>PARANODES.IO/04 - EsNZHmG4bQMGzQNK4Z2CR7Hdhu4or7p2vsLRChUEJcjJAeU</li>
    <li>PARANODES.IO/05 - EriYFJuqCeBF6SFkKxyQWwaTvT9tcoF9ZGDQ4LX3a1iBsYr</li>
 </ul>
</p>
 
<p>
<b>Primary Identity</b>
<ul><li>Paradox - HqRcfhH8VXMhuCk5JXe28WMgDDuW9MVDVNofe1nnTcefVZn</li></ul></p>
