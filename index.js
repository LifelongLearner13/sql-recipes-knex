/* --------- DEPENDENCIES --------- */
var express = require('express');
var bodyParser = require('body-parser');
var knex = require('knex')({
    client: 'pg',
    connection: {
        database: 'recipes',
        user: 'ubuntu',
        password: 'thinkful'
    },
});

/* --------- GLOBAL VARIABLES --------- */
var jsonParser = bodyParser.json();
var app = express();

/*----------- USER ENDPOINTS ----------*/
app.post('/recipes', jsonParser, function(request, response) {

    // First, insert the recipe name into the RECIPES table. The id of the newly added recipe
    // is required to complete the insert into the STEPS and RECIPES_TAGS tables.
    knex.insert({
        name: request.body.name
    }).into('recipes').returning('id').then(function(recipeId) {
        
        // Use the array from the JSON file to create a new array of objects that can be inserted into the database
        var stepsInsertArray = request.body.steps.map(function(currentValue) {
            return {
                recipe_id: recipeId[0],
                description: currentValue
            };
        });

        // Use KNEX to insert all steps into the STEPS tabel
        knex.insert(stepsInsertArray).into('steps').then();

        // Loop through all tags given in JSON.
        for (var tag in request.body.tags) {
            // Generate a temporary table containing the tag name only if it doesn't already exist in the TAGS table.
            // Insert the value from the temporary table into the TAGS table. This means only tags that don't already 
            // exist in the table, will be added. Finally, if an insert was made, return the id of the new row.
            knex.raw('insert into tags (tag) select * from (values (?)) as newTags except (select tag from tags) returning id;', request.body.tags[tag]).then(function(response) {
                // knex.raw returns an object containing whatever the SQL statment would have return if executed on the database.
                // If a tag was inserted, the new id will be stored in response.rows[0].id.
                // Check if an insert occured (i.e. response.rows[0] is not an empty array).
                if(response.rows[0]) {
                    // If a new tag was added, associate it with the current recipe in the RECIPES_TAGS table
                    knex.insert({tag_id: response.rows[0].id, recipe_id: recipeId[0]}).into('recipes_tags').then();
                } else {
                    console.log('dont insert');
                }
            });
        }
        
        // Cannot guarantee that all inserts have finished, but need to send a response somewhere.
        response.sendStatus(200);
    });
});

app.get('/recipes', function(request, response) {
    var queryResponse = [];
    
    // select recipes.id, recipes.name, steps.description from recipes join steps on recipes.id = steps.recipe_id ;
    // select recipes.id, recipes.name, tags.tag from recipes right join recipes_tags on recipes.id = recipes_tags.recipe_id left join tags on recipes_tags.tag_id = tags.id;
    knex.select('recipes.id', 'recipes.name', 'steps.description').from('recipes').join('steps', {'recipes.id': 'steps.recipe_id'}).then(function(dbResponse) {
       for(var i in dbResponse){
           console.log(dbResponse[i]);
       }
    });
});

/* ----------- ADD LISTENER --------------- */
var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Listening on port:' + port);
});