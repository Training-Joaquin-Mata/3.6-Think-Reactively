import { Observable, merge, Subject, timer, combineLatest } from "rxjs";
import { mapTo, scan, startWith, distinctUntilChanged, shareReplay, filter,
     pairwise, switchMap, takeUntil } from "rxjs/operators";
import { initLoadingSpinner } from "../services/LoadingSpinnerService";

import { keyCombo } from "../EventCombo"; 

/**
 * Que es lo que debe hacer el programa
 * How Do we count?
 * Start From Zero
 * whan an async task starts, increase the count by 1
 * when a task ends,m decrease the count by 1
 */

const taskStarts = new Subject();
const taskCompletions = new Subject();

export function newTaskStarted(){
    taskStarts.next();
}

export function existingTaskCompleted(){
    taskCompletions.next(); 
}

const showSpinner = (total, completed) => new Observable(()=>{
    const loadingSpinnerPromise = initLoadingSpinner(total, completed);

    loadingSpinnerPromise.then( spinner => {
        spinner.show();}
    );

    return () =>{
        loadingSpinnerPromise.then( spinner => {
            spinner.hide();}
        ); 
    };

 }); 

const loadUp = taskStarts.pipe( mapTo(1) )
const loadDown = taskCompletions.pipe(mapTo(-1))

//merge esta siendo obtenido de rxjs en ves de operators 
//porque se esta creando un nuevo observable en vez de asignar un valor

const loadVariations = merge(loadUp, loadDown);
//<------------------------------------------------------------->//
const currentLoadCount = loadVariations.pipe(
    startWith(0),
    scan((totalCurrentLoads, changeInLoads) => {
        const newLoadCount =  totalCurrentLoads + changeInLoads;
        
        return newLoadCount<0 ? 0: newLoadCount;
    }),
    distinctUntilChanged(),
    //la manera mas correcta se usar shareReaplay es esta, de lo contratio aunque realices un unsubscribe 
    //se va a seguir ejecutando el estado en el que estaba el observable
    shareReplay({bufferSize: 1, refCount: true})
    );

//<------------------------------------------------------------->//
//To show the porcentage of the tasks completed

const loadStats = currentLoadCount.pipe(
    scan((loadStats, loadingUpdate)=>{

        const loadsWentDown = loadingUpdate < loadStats.previousLoading;
        const currentCompleted = loadsWentDown? loadStats.completed + 1: loadStats.completed;
        return {
            total: currentCompleted + loadingUpdate, 
            completed:currentCompleted, 
            previousLoading: loadingUpdate
        }
    }, {total:0, completed:0, previousLoading:0})
)


//<------------------------------------------------------------->//

/**
 * cuando el contador de arriba llegue al 100% se deberia de reiniciar el % del spinner,
 * se puede realizar esto con alguna condicional, o jugando un poco con el estado del observer
 * para esto ultimo lo que se puede hacer es lo siguiente: 
 */
//se llama a showSpinner y se envia el total obtenido de loadStats con un switchMap 
//para que al terminar o al hacer de nuevo la consulta se reinicien los valores
const spinnerWithStats = loadStats.pipe(
    switchMap(stats => showSpinner(stats.total, stats.completed))
);


/**
 * When does the loader need to hide?
 * -when de count of async task goes to 0
 */

const spinnerDeactivated = currentLoadCount.pipe(
    filter( val => val === 0 ),

);

/**
 * When does the loader need to show?
 * -when de count of async task goes from 0 to 1
 */

const spinnerActivated = currentLoadCount.pipe(
    //pairwaise nos regresa una tupla que tiene el estado previo y el siguiente estado
    pairwise(),
    filter( ([prev, next]) => prev === 0 && next === 1),
);

//<------------------------------------------------------------->//

const flashThreshold = timer(2000);
/*
 * The moment the spinner becomes active..
    Switch to waiting for 2s before showing it
    But cancel if it becomes inactive again in the meantime
 */

    const shouldShowSpinner = spinnerActivated.pipe(
        switchMap(() => flashThreshold.pipe(takeUntil(spinnerDeactivated)))
    );

/**
 * When does the spinner need to hide?
 * 
 * spinner became inactive
 * 2seconds have passes
 */

 const shouldHideSpinner = combineLatest(spinnerDeactivated, flashThreshold);

//<------------------------------------------------------------->//
//para usar el keyCombo de eventCombo

const hideSpinnerCombo = keyCombo([ 'q','w','e','r','t','y' ])



/**
 * When the spinners need to show?
 * -> Show the spinner until it´s time to hide it.
 */
shouldShowSpinner.pipe(
    switchMap(()=> spinnerWithStats.pipe(takeUntil(shouldHideSpinner))),
    takeUntil(hideSpinnerCombo)
).subscribe();

export default[];

