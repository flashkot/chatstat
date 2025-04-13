# snowball.en-ru.es6.js

Unfortunately original [jssnowball](https://github.com/mazko/jssnowball) module
can't be tree-shaken and all stemmers will be included in final bundle.

I copied es6 build from original repo and removed all languages except English
and Russian from `newStemmer` and `algorithms` functions.
