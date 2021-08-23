/**
 * Al presionar una serie de teclas se puede acceder a alguna funcion o desactivarla
 * 
 * whenever somebody starts a combo
 *      keep taking(listening) for the rest of the combo keys
 *          until the timer has run out
 *          while the combo is being followed correctly
 *          and until we´ve got (combolenght-1) keys back 
 *  */

import { fromEvent, interval, timer } from "rxjs";
import { exhaustMap, switchMap, takeUntil, takeWhile, map, skip, take, filter } from "rxjs/operators";

const anyKeyPresses = fromEvent(document, 'keypress').pipe(
    map(event=> event.key)
);

function keyPressed(key){

    return anyKeyPresses.pipe(filter(pressedKey=> pressedKey=== key));
}

export function keyCombo(keyCombo){

    const comboInitiator = keyCombo[0];
    return keyPressed(comboInitiator).pipe(
        exhaustMap(()=>{
            //hew, we are in combo mode
            return anyKeyPresses.pipe(
                takeUntil(timer(3000)),
                takeWhile((keyPressed, index)=> keyCombo[index+1]===keyPressed),
                skip(keyCombo.length - 2),
                take( 1)
            )

        })
    )
}

// const comboTriggered  = keyCombo([ 'a', 's', 'd', 'f' ]);

// interval(1000).pipe(
//     takeUntil(comboTriggered)
// ).subscribe({
//     next: x => console.log(x), 
//     complete: ()=> console.log("COMPLETED")
// }) 