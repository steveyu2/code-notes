{
    styleFormat: (styleText) => {
      /* match
        ".a{ ... }  .b{ ... }" => ['.a{ ... }','.b{ ... }']
      */
      let styleMatch = styleText.match(/\.[a-zA-Z-_\s]+\{[^}]+\}/g);
      styleMatch = styleMatch
        ? styleMatch.reduce((results, css) => {
          /* match
            ".a{ ... }" => ['a', '...']
          */
            const match = css.match(/((?<=(\.)).+(?=({))|(?<=({))[^{}]+(?=(})))/g);

            if (match && match[0]&& match[0].trim) {

              return {
                ...results,
                [match[0].trim()]: match[1]
              };
            }
            return results;
          }, {})
        : {};
      return styleMatch;
    },
    createStylesFun: (styles,beforeStyles="")=>{
      return (styleNames)=>{
        if(typeof styles === 'object'||typeof styleNames === 'string'){
          return beforeStyles+';;' + styleNames.split(' ').map(v => styles[v]).join(';;')
        }
      }
    }}