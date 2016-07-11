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
    var tagsInsertArray = request.body.tags.map(function(currentValue) {
        return {
            tag: currentValue
        };
    });

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

        // Select given tags in database.
        // SELECT id FROM tags WHERE tag in tag_array_from_json;
        // If a tag already exists, then associate it with the current recipe in the RECIPES_TAGS table
        // Else insert tag into TAG table, then associate it with the current recipe in the RECIPES_TAGS table
        
        // knex.raw('insert into tags (tag) select * from (values (?) as newTags) except (select tag from tags);', [request.body.tags]).then();
        
        // for newtag in request.body.tags: select * from tags where tag = $newtag$ --> if 0 results, insert into tags (tag) values ($newtag$)
        
        // Associates all tags that already exist in the TAGS table with the current recipe
        // The nested select creates a temporary table which the values are inserted into
        // insert into recipes_tags select $recipe_id$, id from tags where tag in ('tag1', 'tag2', 'tag3');
        knex.insert(knex.select(recipeId[0], 'id').from('tags').whereIn('tag', request.body.tags)).into('recipes_tags').then();
        
    });
});

// {
//     name: 'Khichidi Kadhi',
//     steps: [
//         'Cook rice and lentils',
//         'Thicken yogurt with gram flour, cooking over a low heat',
//         'Add tadka to yogurt'
//     ],
//     tags: ['curry', 'vegetarian']
// }

var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Listening on port:' + port);
});