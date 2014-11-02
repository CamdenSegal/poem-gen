poem-gen
====

`poem-gen` is a poem generator created for NaNoGenMo 2014 by Camden Segal. It uses large source texts from Project Gutenberg to make poems.

How It Works
----

The source texts are converted into word maps - each word is linked with all words that are used before it - so the generator can imitate the usage of the word from the source text.

Then a random word with existent rhymes in the source text is chosen as the first word of the poem. Each line is built from last word to first word using the word map. Words are added till the number of desired syllables is met.

This process is repeated for each line within the confines of the chosen rhyming scheme. Rhyme scheme, source text, and length are customizable.

Installation
----

To install the command line client:

`npm install -g poem-gen`

poem-gen can also be used as a module in other node projects if you install it locally:

`npm install poem-gen`

Use
----

CLI Options

    Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -d, --data [file]      Use built in data file [all]
    -f, --file [file]      Use specific source file
    -r, --repeats [count]  Times to repeat rhyming scheme
    -w, --words [count]    Poem word length (overrides repeats)
    -v, --verbose          Show extra info
    -s, --scheme [scheme]  Scheme name or pattern

Data sets
----

Used with the `-d` option. Like `$ poem -d spooky/moby-dick`

* all - All texts combined together.
* epic
	* epic/gullivers-travels
	* epic/oliver-twist
	* epic/tale-of-two-cities
* romance
	* romance/jane-austen
	* romance/kamasutra
* spooky
	* spooky/dracula
	* spooky/frankenstein
	* spooky/moby-dick
	* spooky/poe
	* spooky/sleepy-hallow
* weird
	* weird/pizza
	* weird/ulysses

Rhyming Schemes
----

Used with the `-s` option. Like `$ poem -s limerick`.

You can also specify a custom scheme in the format of "aX" where `a` is any character for use as a rhyming group specifier and `X` is the number of syllables.

So `$ poem -s "a5 b10 a7"` would generate a three line poem:
* The first line would be five syllables
* The second line would be ten syllables
* And the third line would be 7 syllables and would rhyme with the first line.

Built in schemes:
* sonnet - a10 b10 a10 b10 c10 d10 c10 d10 e10 f10 e10 f10 g10 g10
* haiku - a5 b7 c5
* couplet - a8 a8
* triplet - a8 a8 a8
* alternating - a8 b8 a8 b8
* limerick - a9 a9 b6 b6 a9
