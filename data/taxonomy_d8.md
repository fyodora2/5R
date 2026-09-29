# Refined taxonomy for two heterogeneous groups (decision d8)

The two groups that were too broad in the first coding are split. All other categories are unchanged. Every trial in the two
groups was recoded with the rules below (file `recoding_d8.csv`, one row per trial with the rule that applied). Rules are applied
in the order shown and the first rule that matches decides. The recoding is read by `scripts/final/study_level.py`.

## Approach: "Other psychological" (20 trials) becomes five categories

| Order | Category | Rule |
|---|---|---|
| A1 | Tailored, combined or other multicomponent | The content is selected for each participant by a model or algorithm; or two named approaches are combined or compared in equal measure; or the programme is a multimodal course or a cognitive-task intervention that fits no other rule. |
| A2 | Emotion regulation and emotion-focused | The stated mechanism is processing, expressing or regulating emotions (emotional freedom techniques, emotion-focused training, disclosure of secondary emotions, emotional self-care). |
| A3 | Job crafting and work-role redesign | Participants change the tasks, relationships or perceptions of their own work. |
| A4 | Creative and experiential group formats | Music, storytelling, laughter, peer discussion or a similar experiential group activity. |
| A5 | Stress recovery and coping skills | The programme teaches recovery, detachment from work, reduction of rumination or general stress-coping skills as self-help or brief guidance. |

## Occupation: "Employees in other sectors or mixed occupations" (21 trials) becomes three categories

| Order | Category | Rule |
|---|---|---|
| O1 | Workers selected for a health condition or risk | Eligibility required a clinical or risk criterion: stress-related disorder, elevated stress or distress, burnout complaints, sick leave, frequent sickness absence, obesity, or being "at risk". |
| O2 | Employees of a named occupation, industry or enterprise | The sample was drawn from one occupation, one industry or one enterprise (call centre, information technology, veterinary teams, emotional labour). |
| O3 | Mixed-occupation workers recruited across employers | All remaining trials: employees of several industries or employers, or open recruitment of working adults. |

Teachers, nurses, physicians, other healthcare staff and mental-health or social-care professionals keep their original categories.
