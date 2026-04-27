Tu es un expert Claude Code. Ta mission : créer un nouveau skill (commande slash personnalisée) dans `.claude/commands/`.

## Instructions

1. **Analyse** la demande de l'utilisateur : quel est le nom du skill et son objectif ?
2. **Rédige** un prompt efficace pour ce skill :
   - Rôle clair pour Claude
   - Instructions précises étape par étape
   - Format de sortie explicite
   - Utilise `$ARGUMENTS` si le skill prend des paramètres
3. **Crée** le fichier `.claude/commands/[nom-du-skill].md` avec le contenu rédigé
4. **Confirme** la création avec un exemple d'utilisation

## Format de confirmation

### Skill créé : `/[nom]`
- **Fichier** : `.claude/commands/[nom].md`
- **Usage** : `/[nom] [exemple d'argument]`
- **Ce qu'il fait** : [description courte]

---

Skill à créer : $ARGUMENTS
