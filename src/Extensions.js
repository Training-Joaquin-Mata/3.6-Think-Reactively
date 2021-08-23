import { interval, Observable } from "rxjs";
import { take } from "rxjs/operators";
import { newTaskStarted, existingTaskCompleted } from "../src/lesson-code/TaskProgressService"


export function showLoadingStatus(source){

    return source =>{
        return new Observable((subscriber)=>{
            newTaskStarted();
            console.log("task Started")
            const sourceSubscription =  source.subscribe(subscriber);
            return ()=> {
                sourceSubscription.unsubscribe();
                existingTaskCompleted();
                console.log("task completed")
            }
        });
    };

}

// interval(500).pipe(
//     take(2),
//     showLoadingStatus()
//     ).subscribe({
//         next: x=> console.log(`next: ${x}`),
//         complete: ()=> console.log('COMPLETED!')
//     })


/*
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
      existingTaskCompleted();
    }, 300);
  });
*/

export class PromiseWithLoadingProgress extends Promise{
    constructor(callback){
        super((originalResolve, originalReject)=>{
                const resolveSpy = (...args)=>{
                    originalResolve(...args);
                    existingTaskCompleted();
                }
                const rejectSpy = (...args)=>{
                    originalReject(...args);
                    existingTaskCompleted();
                }
                callback(resolveSpy, rejectSpy);

        });
        newTaskStarted();
    }
}