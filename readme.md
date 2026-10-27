QUESTION 1 · SALES
Do you know what percentage of enquiries convert into paying customers?
We don't track enquiries or conversions.
We have a rough estimate, based on experience.
We track enquiries and conversions periodically.
We regularly track conversion rates and use them to improve sales.
QUESTION 2 · SALES
How consistently does your team follow up with potential customers who don't buy immediately?
There is no defined follow-up process.
Follow-ups depend on individual employees or my availability.
We follow up with most prospects, but the process is inconsistent.
We have a defined follow-up process and track its results.
QUESTION 3 · SALES
Do you know which channel brings you the most valuable customers?
We don't know where most customers come from.
We have a rough idea from experience.
We track leads or sales by acquisition channel.
We compare channel costs, conversion and customer value.
QUESTION 4 · SALES
How do you encourage existing customers to return or recommend your business?
We don't have a defined retention or referral approach.
We rely mainly on customers remembering us or recommending us.
We conduct occasional follow-ups or referral activities.
We have a consistent retention or referral process and measure its results.
QUESTION 5 · SALES
If your sales fell by 20% next month, how confidently could you identify the cause?
I would mostly be guessing.
I could identify some possible reasons, but not verify them.
I track some sales indicators and could investigate the decline.
I can analyze the sales funnel, order value, customer mix and repeat purchases to identify likely causes.
QUESTION 6 · OPERATIONS
If you were unavailable for seven days, how smoothly would your business operate?
Critical activities would stop or require my intervention.
The team could manage some activities, but significant problems would arise.
Most activities would continue, with a few bottlenecks.
Documented processes and delegated decision-making allow operations to continue smoothly.
QUESTION 7 · OPERATIONS
How consistently do employees follow the same process for recurring tasks?
Employees generally work in their own ways.
Most processes depend on verbal instructions and individual experience.
Important tasks have documented steps, but adherence varies.
Key processes are documented, followed and periodically reviewed.
QUESTION 8 · OPERATIONS
How do you measure employee performance?
Primarily through observation, complaints or intuition.
We discuss performance informally, without clear targets.
We set targets for some important roles and review them periodically.
We use role-specific KPIs and regular performance reviews to address gaps.
QUESTION 9 · OPERATIONS
How effectively does your business identify and resolve repeated mistakes, delays or customer complaints?
Issues recur frequently, and we rarely investigate why.
We fix issues when they arise but rarely address their root causes.
We track recurring issues and resolve some underlying causes.
We track recurring issues, investigate root causes and verify whether corrective actions work.
QUESTION 10 · OPERATIONS
How much of your working time goes into routine approvals, firefighting and tasks others could potentially handle?
Most of my time.
A substantial part of my time.
Some time, although many responsibilities are delegated.
Limited time; responsibilities, decision rights and escalation rules are clear.
QUESTION 11 · FINANCE
Can you reliably state your monthly revenue, operating expenses and operating profit?
I cannot reliably access these figures.
I know my revenue, but I don't have a clear picture of expenses and profit.
I can access these figures from financial records.
I review these figures regularly and compare them against targets or previous periods.
QUESTION 12 · FINANCE
Do you know which products, services or customer segments generate the best margins?
No, we don't assess profitability at this level.
We rely mainly on intuition or sales volume.
We estimate margins for our major products or services.
We review margins and use them to inform pricing and resource allocation.
QUESTION 13 · FINANCE
How well can you forecast whether you will have enough cash to meet upcoming expenses?
We often discover cash shortages when payments are due.
We check the bank balance and immediate expenses.
We maintain a basic cash-flow forecast or upcoming payment schedule.
We regularly forecast cash inflows, outflows and potential shortfalls.
QUESTION 14 · FINANCE
How systematically do you track and collect overdue customer payments?
There is no consistent process for tracking or collecting overdue payments.
We follow up when someone remembers or a payment becomes urgent.
We track outstanding payments and follow up regularly.
We review receivables ageing, collection timelines and escalation actions.
QUESTION 15 · FINANCE
Do you know the sales level at which your business covers its operating costs?
No, we have not calculated it.
We have a rough estimate based on experience.
We have calculated an approximate break-even sales level.
We understand our break-even level and monitor actual performance against it.
2. Backend scoring logic
A. Assign points to answers
Every question uses the same scoring scale.
Answer level
Score
Option 1 — weakest system or visibility
0
Option 2 — informal or limited approach
1
Option 3 — partially established approach
2
Option 4 — consistent, measured approach
3

Higher scores represent stronger business practices and visibility. They do not necessarily prove that the business is profitable or performing well.
B. Calculate the three pillar scores
Each pillar has five questions, with a maximum of 15 points.

PillarScore=PointsEarned15100
Calculate:
Sales Score = (Q1 + Q2 + Q3 + Q4 + Q5) ÷ 15 × 100
Operations Score = (Q6 + Q7 + Q8 + Q9 + Q10) ÷ 15 × 100
Finance Score = (Q11 + Q12 + Q13 + Q14 + Q15) ÷ 15 × 100
C. Calculate the overall Business Health Score
The total maximum score is 45 points.
{Health Score}={Summation{Qi}/45}*100
Round the result to the nearest whole number for display.
Example: A founder scores 31 out of 45.

HealthScore=3145100=69
The displayed score is 69/100.
D. Classify the result
Use these initial categories for your workshop pilot. Treat them as provisional labels until you have enough real assessment data to calibrate them.
Score
Classification
Interpretation
80–100
Stronger foundations
Systems appear relatively established; identify the next constraint.
51–79
Room to strengthen
Some systems may be inconsistent, under-measured or under-optimized.
0–50
Priority areas to investigate
Important visibility, process or control gaps may exist.

E. Identify the weakest business pillar
Compare the three pillar scores.
Lowest score = Primary area to investigate
Second-lowest score = Secondary area to investigate
Highest score = Relative strength
For example:
Pillar
Score
Sales
80/100
Operations
40/100
Finance
60/100

Result: Operations is the primary area to investigate, finance is the secondary area, and sales is the relative strength.
If two pillars tie for the lowest score, show both rather than arbitrarily choosing one.
F. Generate a personalized result
Use the following rules to generate the results page.
Condition
Suggested result message
Sales has the lowest score
Investigate lead conversion, follow-up discipline, acquisition channels and repeat business.
Operations has the lowest score
Investigate founder dependency, process consistency, employee accountability and recurring errors.
Finance has the lowest score
Investigate margin visibility, cash-flow forecasting, overdue payments and break-even.
Overall score is 80+
Identify the next constraint and opportunities for measurable optimization.
Overall score is 51–79
Strengthen inconsistent systems and validate where performance is leaking.
Overall score is 50 or below
Establish basic visibility and investigate the most important operational or financial risks first.

3. Essential rules
Require all 15 questions before generating a final score.
Store each answer as an integer from 0 to 3.
Validate that every answer is within the allowed range.
Do not treat unanswered questions as zero; mark the assessment incomplete instead.
Calculate all scores on the server when the assessment is submitted, even if the frontend displays a preview.
Store the individual answers, three pillar scores, overall score, assessment timestamp and scoring-version identifier.
Display the score as a self-assessment indicator, not a certified business rating.