# PikaPods (beginner-friendly)

[PikaPods](https://www.pikapods.com/) offers managed hosting for many open source apps, including Hoarder.
Server administration, updates, migrations and backups are all taken care of, which makes it well suited
for less technical users.

### Requirements

- A free *PikaPods* account. Can be created [here](https://www.pikapods.com/register).

### 1. Choose app

Choose *Hoarder* from their [list of apps](https://www.pikapods.com/apps) or us 
this [direct link](https://www.pikapods.com/pods?run=hoarder). This will either
open a new dialog to add a new *Hoarder* pod or ask you to log in.

### 2. Add settings

There are a few settings to configure in the dialog:

- **Basics**: Give the pod a name and choose a region that's near you.
- **Env Vars**: Here you can disable signups or set an OpenAI API key. All settings are optional.
- **Resources**: The resources your *Hoarder* pod can use. The defaults are fine, unless you have a very large collection.

### 3. Start pod and add user

After hitting *Add pod* it will take about a minute for the app to fully start. After this you can visit
the pod's URL and add an initial user under *Sign Up*. After this you may want to disable further sign-ups
by setting the pod's `DISABLE_SIGNUPS` *Env Var* to `false`.
