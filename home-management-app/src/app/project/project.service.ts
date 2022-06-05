import { Injectable, OnInit } from '@angular/core';
import { Project } from './project-detail/project.model';
import { AuthService } from '../authentication/auth.service';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'
import { lastValueFrom } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class ProjectService implements OnInit{
  projectCollection: AngularFirestoreCollection<Project>
  projects: Observable<Project[]>;
  projectDoc: AngularFirestoreDocument<Project>; //for delteting indv. project doc
  project: Observable<Project>;


  constructor(private authService: AuthService, public afs: AngularFirestore)
  {
    // Firestore route for project Collection w/in each user
    this.projectCollection = this.afs
      .collection('users')
      .doc(this.authService.userData.uid)
      .collection('projects')

    // Retrieve all projects from the database METHOD 2 - SNAPSHOT changes gives back observable w/ ID/metadata
    this.projects = this.projectCollection
      .snapshotChanges()
      .pipe(
        map(changes => changes.map(a => {
          const data = a.payload.doc.data() as Project; //shows uniquie ID generated by Firestore when project is created;
          // Assign Firestore Generated UID to project.
          //                THIS ISN'T IDEAL...CAN I PUT IT IN THE 'CREATE PROJECT SERVICE ?
          data.id = a.payload.doc.id;
          return data;
          })
        )
      ) //value changes sends as an observable that needs to be subscribed to
   }

  ngOnInit(): void {

  }

  // Create project to User Specific Firestore database
  createProject(project: Project) {
    const projectData: Project = {
      name: project.name,
      room: project.room,
      description: project.description,
      status: project.status,
      grandTotal: project.grandTotal,
      // FUTURE: ADD TIME STAMP
    };
    this.afs
      .collection('users')
      .doc(this.authService.userData.uid)
      .collection('projects')
      .add(projectData )
      .then((dataAdded) => {
        projectData.id = dataAdded.id;
        console.log('Project Added to Firebase: ', dataAdded.id)
      })
      .catch((error) => {
          console.error('Error adding document: ', error)
      })
    console.log('project id when created: ', projectData.id)
}

  // Retrieve all projects for user
  getProjects() {
    return this.projects;
  }

  // Get indv. project; pass in firebase unique id (uid)
  getProject(projectID) {
    this.project = this.afs
      .collection('users')
      .doc(this.authService.userData.uid)
      .collection('projects')
      .doc(projectID)
      .snapshotChanges()
      .pipe(
        map(changes => {
          const data = changes.payload.data() as Project; //shows uniquie ID generated by Firestore when project is created;
          // Assign Firestore Generated UID to project.
          //                THIS ISN'T IDEAL...CAN I PUT IT IN THE 'CREATE PROJECT SERVICE ?
          // data.id = changes.payload.id;
          return data;
          })
    )
    return this.project
  }

  deleteProject(project: Project) {
    console.log(project.id)
    this.projectDoc = this.afs.doc(`users/${this.authService.userData.uid}/projects/${project.id}`);
    this.projectDoc.delete();
    // this.projectDoc = this.afs.doc()
  }

}
